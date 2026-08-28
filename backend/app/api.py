from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openai import APIStatusError, RateLimitError

from .agent_service import CouncilAgentService
from .config import Settings, resolve_openai_api_key
from .database import Database
from .participants import ParticipantRegistry
from .schemas import (
    AgentResponse,
    JournalCreate,
    JournalEnvelope,
    JournalsEnvelope,
    MeetingEnvelope,
    MeetingCreate,
    MeetingTurnCreate,
    Participant,
    ParticipantsEnvelope,
    TranscriptionResult,
    TurnResult,
)


MAX_AUDIO_BYTES = 25 * 1024 * 1024


def create_app(
    settings: Settings | None = None,
    *,
    service: CouncilAgentService | None = None,
) -> FastAPI:
    settings = settings or Settings()
    database = Database(settings.database_path)
    registry = ParticipantRegistry(settings.participants_path)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        database.initialize()
        settings.audio_dir.mkdir(parents=True, exist_ok=True)
        app.state.database = database
        app.state.registry = registry
        if service is not None:
            app.state.agent_service = service
        else:
            api_key = resolve_openai_api_key()
            app.state.agent_service = (
                CouncilAgentService(
                    database=database,
                    audio_dir=settings.audio_dir,
                    api_key=api_key,
                    agent_model=settings.agent_model,
                    tts_model=settings.tts_model,
                    transcription_model=settings.transcription_model,
                )
                if api_key
                else None
            )
        yield

    app = FastAPI(title="AshenSpire Council API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def participants_by_id() -> dict[str, Participant]:
        try:
            return registry.by_id()
        except (RuntimeError, ValueError) as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    def require_service() -> CouncilAgentService:
        current = app.state.agent_service
        if current is None:
            raise HTTPException(
                status_code=503,
                detail="OpenAI API access is not configured for this local service.",
            )
        return current

    @app.get("/health")
    async def health() -> dict[str, str | bool]:
        return {
            "status": "ok",
            "openai_configured": app.state.agent_service is not None,
        }

    @app.get("/api/participants", response_model=ParticipantsEnvelope)
    async def list_participants() -> dict:
        return {"participants": list(participants_by_id().values())}

    @app.post("/api/meetings", response_model=MeetingEnvelope, status_code=201)
    async def create_meeting(payload: MeetingCreate) -> dict:
        known = participants_by_id()
        participant_ids = list(dict.fromkeys(payload.participant_ids))
        unknown = [value for value in participant_ids if value not in known]
        if unknown:
            raise HTTPException(
                status_code=422,
                detail=f"Unknown participant ids: {', '.join(unknown)}",
            )
        return {
            "meeting": database.create_meeting(
                payload.title, payload.agenda, participant_ids
            )
        }

    @app.get("/api/meetings/{meeting_id}", response_model=MeetingEnvelope)
    async def get_meeting(meeting_id: str) -> dict:
        meeting = database.get_meeting(meeting_id)
        if meeting is None:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return {"meeting": meeting}

    @app.post("/api/meetings/{meeting_id}/turn", response_model=TurnResult)
    async def add_meeting_turn(meeting_id: str, payload: MeetingTurnCreate) -> dict:
        meeting = database.get_meeting(meeting_id)
        if meeting is None:
            raise HTTPException(status_code=404, detail="Meeting not found")

        user_entry = database.add_turn(
            meeting_id=meeting_id,
            speaker_id="constantine",
            speaker_name="Constantine",
            speaker_role="Product Owner",
            kind="user",
            text=payload.text,
        )
        meeting = database.get_meeting(meeting_id) or meeting
        registry_values = participants_by_id()
        participants = [registry_values[value] for value in meeting["participant_ids"]]
        agent_service = require_service()

        try:
            generated = await asyncio.gather(
                *(agent_service.respond(participant, meeting, payload.text) for participant in participants)
            )
        except RateLimitError as exc:
            error_code = getattr(exc, "code", None)
            if error_code in {"insufficient_quota", "credit_balance_exhausted"}:
                raise HTTPException(
                    status_code=402,
                    detail=(
                        "OpenAI API credits are exhausted for this project. Add billing credits "
                        "before starting a generated voice turn."
                    ),
                ) from exc
            raise HTTPException(
                status_code=429,
                detail="OpenAI API rate limit reached. Wait briefly and try again.",
            ) from exc
        except APIStatusError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"OpenAI API request failed with status {exc.status_code}.",
            ) from exc
        responses: list[dict] = []
        for participant, (text, audio_url) in zip(participants, generated, strict=True):
            database.add_turn(
                meeting_id=meeting_id,
                speaker_id=participant.id,
                speaker_name=participant.name,
                speaker_role=participant.role,
                kind="agent",
                text=text,
                audio_url=audio_url,
            )
            database.add_journal(
                participant_id=participant.id,
                note=text,
                kind="recorded_utterance",
                meeting_id=meeting_id,
            )
            agent_turn = database.get_meeting(meeting_id)["entries"][-1]
            responses.append(
                AgentResponse(
                    participant_id=participant.id,
                    name=participant.name,
                    text=text,
                    audio_url=audio_url,
                    timestamp=agent_turn["timestamp"],
                ).model_dump()
            )
        return {
            "meeting_id": meeting_id,
            "user_entry": user_entry,
            "responses": responses,
        }

    @app.post("/api/transcribe", response_model=TranscriptionResult)
    async def transcribe(file: UploadFile = File(...)) -> dict[str, str]:
        content = await file.read(MAX_AUDIO_BYTES + 1)
        if not content:
            raise HTTPException(status_code=422, detail="Audio file is empty")
        if len(content) > MAX_AUDIO_BYTES:
            raise HTTPException(status_code=413, detail="Audio file exceeds 25 MB")
        text = await require_service().transcribe(
            filename=file.filename or "recording.webm",
            content=content,
            content_type=file.content_type or "application/octet-stream",
        )
        return {"text": text}

    @app.get("/api/audio/{filename}")
    async def audio(filename: str) -> FileResponse:
        if Path(filename).name != filename or not filename.endswith(".mp3"):
            raise HTTPException(status_code=404, detail="Audio not found")
        path = settings.audio_dir / filename
        if not path.is_file():
            raise HTTPException(status_code=404, detail="Audio not found")
        return FileResponse(path, media_type="audio/mpeg", filename=filename)

    @app.post(
        "/api/participants/{participant_id}/journal",
        response_model=JournalEnvelope,
        status_code=201,
    )
    async def add_journal(participant_id: str, payload: JournalCreate) -> dict:
        if participant_id not in participants_by_id():
            raise HTTPException(status_code=404, detail="Participant not found")
        return {
            "entry": database.add_journal(
                participant_id=participant_id,
                note=payload.note,
                kind="user_supplied_fact",
            )
        }

    @app.get(
        "/api/participants/{participant_id}/journal",
        response_model=JournalsEnvelope,
    )
    async def get_journal(participant_id: str) -> dict:
        if participant_id not in participants_by_id():
            raise HTTPException(status_code=404, detail="Participant not found")
        return {"entries": database.participant_journal(participant_id)}

    if settings.frontend_dist.is_dir():
        app.mount(
            "/",
            StaticFiles(directory=settings.frontend_dist, html=True),
            name="frontend",
        )

    return app
