from __future__ import annotations

import uuid
from pathlib import Path

from agents import Agent, Runner
from agents.models.openai_responses import OpenAIResponsesModel
from openai import AsyncOpenAI

from .database import Database
from .schemas import Participant


GLOBAL_AUTHORITY_BOUNDARIES = """
AshenSpire authority boundaries:
- Project Management recommends portfolio order and capacity.
- IT Manager III owns final technical operating priority, integration, and
  implementation decisions only within that role's authority.
- Help Desk owns intake, deduplication, and audit; it does not approve delivery.
- Constantine retains all Product Owner decisions.
- Discussion is not authorization. Never claim to push, merge, mutate a repository
  or board, change an automation, deploy, deliver, publish, or release anything.
""".strip()


class CouncilAgentService:
    def __init__(
        self,
        *,
        database: Database,
        audio_dir: Path,
        api_key: str,
        agent_model: str,
        tts_model: str,
        transcription_model: str,
    ):
        self.database = database
        self.audio_dir = audio_dir
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        self.agent_model = agent_model
        self.tts_model = tts_model
        self.transcription_model = transcription_model
        self.openai = AsyncOpenAI(api_key=api_key)

    @staticmethod
    def _instructions(participant: Participant) -> str:
        traits = ", ".join(participant.traits) or "clear and concise"
        boundaries = "\n".join(f"- {item}" for item in participant.boundaries)
        return f"""
You are the AI meeting representative for {participant.name}, identified by the
stable role {participant.role} on the {participant.team} team. You are software,
not a human being, and must never imply otherwise. Use the participant's name and
role consistently, but do not invent biography, experience, feelings, memories,
actions, approvals, or facts.

Communication traits: {traits}.
Role authority: {participant.authority}
Role boundaries:
{boundaries or '- Stay within the stated authority.'}
AI disclosure: {participant.ai_disclosure}

{GLOBAL_AUTHORITY_BOUNDARIES}

Use journal entries only according to their labels. User-supplied factual notes are
context supplied by Constantine. Recorded meeting utterances are continuity aids,
not verified project facts. If evidence is missing, say it is unknown. Answer only
the meeting question, briefly and in first-person role voice, without claiming
human identity or actions outside the meeting.
""".strip()

    @staticmethod
    def _input(
        participant: Participant, meeting: dict, user_text: str, journal: list[dict]
    ) -> str:
        recent_turns = meeting.get("entries", [])[-20:]
        history = "\n".join(
            f"[{turn['speaker_name']} / {turn['kind']}] {turn['text']}"
            for turn in recent_turns
        ) or "(none)"
        journal_text = "\n".join(
            f"[{entry['kind']}; {entry['verification']}] {entry['note']}"
            for entry in journal
        ) or "(none)"
        return f"""
Meeting title: {meeting['title']}
Agenda: {meeting['agenda']}

Recent meeting transcript:
{history}

Your continuity journal:
{journal_text}

Constantine's current message:
{user_text}

Respond as {participant.name}, the AI representative for {participant.role}.
""".strip()

    async def respond(
        self, participant: Participant, meeting: dict, user_text: str
    ) -> tuple[str, str]:
        journal = self.database.participant_journal(participant.id)
        agent = Agent(
            name=participant.name,
            instructions=self._instructions(participant),
            model=OpenAIResponsesModel(
                model=self.agent_model,
                openai_client=self.openai,
            ),
        )
        result = await Runner.run(
            agent,
            input=self._input(participant, meeting, user_text, journal),
        )
        text = str(result.final_output).strip()
        if not text:
            raise RuntimeError(f"{participant.name} returned an empty response")
        audio_url = await self.synthesize(participant, text)
        return text, audio_url

    async def synthesize(self, participant: Participant, text: str) -> str:
        filename = f"{participant.id}-{uuid.uuid4().hex}.mp3"
        path = self.audio_dir / filename
        async with self.openai.audio.speech.with_streaming_response.create(
            model=self.tts_model,
            voice=participant.voice.id,
            input=text,
            instructions=participant.voice.instructions,
            response_format="mp3",
        ) as response:
            await response.stream_to_file(path)
        return f"/api/audio/{filename}"

    async def transcribe(
        self, *, filename: str, content: bytes, content_type: str
    ) -> str:
        result = await self.openai.audio.transcriptions.create(
            model=self.transcription_model,
            file=(filename, content, content_type),
        )
        return result.text.strip()
