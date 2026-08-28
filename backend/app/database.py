from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Database:
    def __init__(self, path: Path):
        self.path = path

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS meetings (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    agenda TEXT NOT NULL,
                    participant_ids TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS turns (
                    id TEXT PRIMARY KEY,
                    meeting_id TEXT NOT NULL,
                    speaker_id TEXT NOT NULL,
                    speaker_name TEXT NOT NULL,
                    speaker_role TEXT NOT NULL,
                    kind TEXT NOT NULL CHECK (kind IN ('user', 'agent')),
                    text TEXT NOT NULL,
                    audio_url TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS journals (
                    id TEXT PRIMARY KEY,
                    participant_id TEXT NOT NULL,
                    note TEXT NOT NULL,
                    kind TEXT NOT NULL CHECK (
                        kind IN ('user_supplied_fact', 'recorded_utterance')
                    ),
                    meeting_id TEXT,
                    created_at TEXT NOT NULL,
                    verification TEXT NOT NULL,
                    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
                );
                CREATE INDEX IF NOT EXISTS idx_turns_meeting
                    ON turns(meeting_id, created_at);
                CREATE INDEX IF NOT EXISTS idx_journals_participant
                    ON journals(participant_id, created_at);
                """
            )

    def create_meeting(
        self, title: str, agenda: str, participant_ids: list[str]
    ) -> dict:
        meeting = {
            "id": str(uuid.uuid4()),
            "title": title,
            "agenda": agenda,
            "participant_ids": participant_ids,
            "created_at": utc_now(),
        }
        with self.connect() as connection:
            connection.execute(
                "INSERT INTO meetings VALUES (?, ?, ?, ?, ?)",
                (
                    meeting["id"],
                    title,
                    agenda,
                    json.dumps(participant_ids),
                    meeting["created_at"],
                ),
            )
        meeting["entries"] = []
        return meeting

    def get_meeting(self, meeting_id: str) -> dict | None:
        with self.connect() as connection:
            row = connection.execute(
                "SELECT * FROM meetings WHERE id = ?", (meeting_id,)
            ).fetchone()
            if row is None:
                return None
            turn_rows = connection.execute(
                "SELECT * FROM turns WHERE meeting_id = ? ORDER BY created_at, rowid",
                (meeting_id,),
            ).fetchall()
        return {
            **dict(row),
            "participant_ids": json.loads(row["participant_ids"]),
            "entries": [self._transcript_entry(dict(turn)) for turn in turn_rows],
        }

    @staticmethod
    def _transcript_entry(turn: dict) -> dict:
        return {
            "id": turn["id"],
            "speaker_id": turn["speaker_id"],
            "speaker_name": turn["speaker_name"],
            "speaker_role": turn["speaker_role"],
            "text": turn["text"],
            "timestamp": turn["created_at"],
            "kind": turn["kind"],
        }

    def add_turn(
        self,
        *,
        meeting_id: str,
        speaker_id: str,
        speaker_name: str,
        speaker_role: str,
        kind: str,
        text: str,
        audio_url: str | None = None,
    ) -> dict:
        turn = {
            "id": str(uuid.uuid4()),
            "meeting_id": meeting_id,
            "speaker_id": speaker_id,
            "speaker_name": speaker_name,
            "speaker_role": speaker_role,
            "kind": kind,
            "text": text,
            "audio_url": audio_url,
            "created_at": utc_now(),
        }
        with self.connect() as connection:
            connection.execute(
                "INSERT INTO turns VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                tuple(turn.values()),
            )
        return self._transcript_entry(turn)

    def add_journal(
        self,
        *,
        participant_id: str,
        note: str,
        kind: str,
        meeting_id: str | None = None,
    ) -> dict:
        verification = (
            "User supplied; treat as factual context unless corrected."
            if kind == "user_supplied_fact"
            else "Recorded meeting utterance; not a verified project fact."
        )
        entry = {
            "id": str(uuid.uuid4()),
            "participant_id": participant_id,
            "note": note,
            "kind": kind,
            "meeting_id": meeting_id,
            "created_at": utc_now(),
            "verification": verification,
        }
        with self.connect() as connection:
            connection.execute(
                "INSERT INTO journals VALUES (?, ?, ?, ?, ?, ?, ?)",
                tuple(entry.values()),
            )
        return entry

    def participant_journal(self, participant_id: str, limit: int = 30) -> list[dict]:
        with self.connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM journals
                WHERE participant_id = ?
                ORDER BY created_at DESC, rowid DESC
                LIMIT ?
                """,
                (participant_id, limit),
            ).fetchall()
        return [dict(row) for row in reversed(rows)]
