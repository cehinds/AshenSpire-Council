from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.agent_service import CouncilAgentService
from app.database import Database
from app.schemas import Participant


@pytest.fixture
def participant() -> Participant:
    return Participant.model_validate(
        {
            "id": "pm",
            "name": "Mara Ellison",
            "initials": "ME",
            "role": "Project Management Lead",
            "team": "Project Management",
            "tier": "portfolio-advisory-lead",
            "status": "active",
            "canonical_task_id": "task-pm",
            "voice": {
                "id": "marin",
                "label": "marin-clear-horizon",
                "instructions": "Warm, compact, and explicit about authority.",
            },
            "traits": ["structured", "capacity-aware"],
            "authority": "Recommend portfolio order and capacity.",
            "boundaries": ["Must not make final technical decisions."],
            "source_basis": ["Canonical participant registry."],
            "ai_disclosure": "AI role persona; not a human employee.",
        }
    )


@pytest.mark.asyncio
async def test_transcription_calls_openai_audio_api(tmp_path):
    service = CouncilAgentService(
        database=Database(tmp_path / "db.sqlite3"),
        audio_dir=tmp_path / "audio",
        api_key="test-key",
        agent_model="test-agent",
        tts_model="test-tts",
        transcription_model="test-transcribe",
    )
    create = AsyncMock(return_value=SimpleNamespace(text="  Heard clearly.  "))
    service.openai = SimpleNamespace(
        audio=SimpleNamespace(transcriptions=SimpleNamespace(create=create))
    )

    text = await service.transcribe(
        filename="turn.webm", content=b"bytes", content_type="audio/webm"
    )

    assert text == "Heard clearly."
    create.assert_awaited_once_with(
        model="test-transcribe",
        file=("turn.webm", b"bytes", "audio/webm"),
    )


def test_role_prompt_enforces_identity_and_authority(participant: Participant):
    prompt = CouncilAgentService._instructions(participant)
    normalized = " ".join(prompt.split())

    assert "software, not a human being" in normalized
    assert "Project Management recommends portfolio order and capacity" in normalized
    assert "Constantine retains all Product Owner decisions" in normalized
    assert "Recorded meeting utterances" in normalized
    assert "not verified project facts" in normalized
    assert "Never claim to push, merge" in normalized
