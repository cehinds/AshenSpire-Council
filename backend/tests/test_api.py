from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api import create_app
from app.config import Settings


RAW_PARTICIPANT = {
    "stable_id": "itm3",
    "personal_name": "Morgan Vale",
    "initials": "MV",
    "role": "IT Manager III, Integration & Delivery",
    "team": "Integration & Delivery",
    "tier": "leadership",
    "status": "active",
    "canonical_task_id": "task-itm3",
    "voice": {
        "api_voice_id": "cedar",
        "instructions": "Measured, direct, calm delivery.",
        "voice_profile_label": "Cedar",
    },
    "traits": ["precise", "calm"],
    "authority": {
        "may": ["Final technical operating priority and integration decisions."],
        "must_not": ["Does not make Product Owner decisions."],
    },
    "source_basis": "Canonical meeting participant task.",
    "ai_disclosure": "AI representative for the IT Manager III role.",
}


class FakeAgentService:
    def __init__(self, audio_dir: Path):
        self.audio_dir = audio_dir

    async def respond(self, participant, meeting, user_text):
        filename = f"{participant.id}-mock.mp3"
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        (self.audio_dir / filename).write_bytes(b"mock mp3")
        return "My technical recommendation is bounded and requires approval.", f"/api/audio/{filename}"

    async def transcribe(self, *, filename, content, content_type):
        assert filename == "meeting.webm"
        assert content == b"audio-bytes"
        return "Transcribed meeting input."


@pytest.fixture
def client(tmp_path: Path):
    participant_path = tmp_path / "participants.json"
    participant_path.write_text(json.dumps([RAW_PARTICIPANT]), encoding="utf-8")
    audio_dir = tmp_path / "audio"
    settings = Settings(
        participants_path=participant_path,
        database_path=tmp_path / "council.sqlite3",
        audio_dir=audio_dir,
    )
    app = create_app(settings, service=FakeAgentService(audio_dir))
    with TestClient(app) as value:
        yield value


def test_health_and_participants(client: TestClient):
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok", "openai_configured": True}

    participants = client.get("/api/participants")
    assert participants.status_code == 200
    participant = participants.json()["participants"][0]
    assert participant["role"] == RAW_PARTICIPANT["role"]
    assert participant["id"] == "itm3"
    assert participant["voice"]["id"] == "cedar"


def test_meeting_turn_persists_attribution_and_recorded_utterance(client: TestClient):
    created = client.post(
        "/api/meetings",
        json={
            "title": "Priority review",
            "agenda": "Review operating priority.",
            "participant_ids": ["itm3"],
        },
    )
    assert created.status_code == 201
    assert created.json()["meeting"]["entries"] == []
    meeting_id = created.json()["meeting"]["id"]

    turn = client.post(
        f"/api/meetings/{meeting_id}/turn",
        json={"text": "What should come first?"},
    )
    assert turn.status_code == 200
    body = turn.json()
    assert body["responses"][0]["name"] == "Morgan Vale"
    assert body["responses"][0]["audio_url"] == "/api/audio/itm3-mock.mp3"

    readback = client.get(f"/api/meetings/{meeting_id}")
    assert readback.status_code == 200
    entries = readback.json()["meeting"]["entries"]
    assert [item["kind"] for item in entries] == ["user", "agent"]
    assert entries[1]["speaker_role"] == RAW_PARTICIPANT["role"]
    journal = client.app.state.database.participant_journal("itm3")
    assert journal[-1]["kind"] == "recorded_utterance"
    assert journal[-1]["verification"] == (
        "Recorded meeting utterance; not a verified project fact."
    )

    audio = client.get("/api/audio/itm3-mock.mp3")
    assert audio.status_code == 200
    assert audio.content == b"mock mp3"


def test_user_journal_and_transcription(client: TestClient):
    journal = client.post(
        "/api/participants/itm3/journal",
        json={"content": "Constantine supplied this fact."},
    )
    assert journal.status_code == 201
    assert journal.json()["entry"]["kind"] == "user_supplied_fact"
    assert "User supplied" in journal.json()["entry"]["verification"]
    readback = client.get("/api/participants/itm3/journal")
    assert readback.status_code == 200
    assert readback.json()["entries"][-1]["note"] == "Constantine supplied this fact."

    transcription = client.post(
        "/api/transcribe",
        files={"file": ("meeting.webm", b"audio-bytes", "audio/webm")},
    )
    assert transcription.status_code == 200
    assert transcription.json() == {"text": "Transcribed meeting input."}


def test_rejects_unknown_participant_and_path_traversal(client: TestClient):
    unknown = client.post(
        "/api/meetings",
        json={"title": "x", "agenda": "y", "participant_ids": ["unknown"]},
    )
    assert unknown.status_code == 422
    assert client.get("/api/audio/not-an-audio.txt").status_code == 404
