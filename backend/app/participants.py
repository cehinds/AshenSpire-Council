from __future__ import annotations

import json
from pathlib import Path

from .schemas import Participant


class ParticipantRegistry:
    def __init__(self, path: Path):
        self.path = path

    def all(self) -> list[Participant]:
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            raise RuntimeError(f"Participant registry is missing: {self.path}") from exc
        values = raw.get("participants", raw) if isinstance(raw, dict) else raw
        return [Participant.model_validate(self._normalize(value)) for value in values]

    @staticmethod
    def _normalize(value: dict) -> dict:
        """Adapt the persisted registry shape to the stable public API contract."""
        authority = value.get("authority", {})
        voice = value.get("voice", {})
        normalized = dict(value)
        normalized["id"] = normalized.pop("stable_id", normalized.get("id"))
        normalized["name"] = normalized.pop("personal_name", normalized.get("name"))
        normalized["voice"] = {
            "id": voice.get("api_voice_id", voice.get("id")),
            "label": voice.get("voice_profile_label", voice.get("label")),
            "instructions": voice.get("instructions", ""),
        }
        if isinstance(authority, dict):
            normalized["authority"] = "; ".join(authority.get("may", []))
            normalized["boundaries"] = list(authority.get("must_not", []))
        return normalized

    def by_id(self) -> dict[str, Participant]:
        return {participant.id: participant for participant in self.all()}
