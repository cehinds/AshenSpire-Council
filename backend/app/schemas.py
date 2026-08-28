from __future__ import annotations

from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class Voice(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    instructions: str
    label: str


class Participant(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    initials: str
    role: str
    team: str
    tier: str
    status: str
    canonical_task_id: str | None = None
    voice: Voice
    traits: list[str] = Field(default_factory=list)
    authority: str
    boundaries: list[str] = Field(default_factory=list)
    source_basis: str | list[str]
    ai_disclosure: str


class MeetingCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    agenda: str = Field(min_length=1, max_length=10_000)
    participant_ids: list[str] = Field(min_length=1, max_length=50)


class MeetingTurnCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1, max_length=20_000)


class JournalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: str = Field(
        min_length=1,
        max_length=20_000,
        validation_alias=AliasChoices("note", "content"),
    )


class JournalEntry(BaseModel):
    id: str
    participant_id: str
    note: str
    kind: Literal["user_supplied_fact", "recorded_utterance"]
    meeting_id: str | None
    created_at: str
    verification: str


class TranscriptEntry(BaseModel):
    id: str
    speaker_id: str
    speaker_name: str
    speaker_role: str
    text: str
    timestamp: str
    kind: Literal["user", "agent"]


class AgentResponse(BaseModel):
    participant_id: str
    name: str
    text: str
    audio_url: str
    timestamp: str


class TurnResult(BaseModel):
    meeting_id: str
    user_entry: TranscriptEntry
    responses: list[AgentResponse]


class Meeting(BaseModel):
    id: str
    title: str
    agenda: str
    participant_ids: list[str]
    created_at: str
    entries: list[TranscriptEntry] = Field(default_factory=list)


class ParticipantsEnvelope(BaseModel):
    participants: list[Participant]


class MeetingEnvelope(BaseModel):
    meeting: Meeting


class JournalEnvelope(BaseModel):
    entry: JournalEntry


class JournalsEnvelope(BaseModel):
    entries: list[JournalEntry]


class TranscriptionResult(BaseModel):
    text: str
