from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
COUNCIL_DIR = BACKEND_DIR.parent
DEFAULT_PARTICIPANTS_PATH = COUNCIL_DIR / "data" / "participants.json"
DEFAULT_DATABASE_PATH = BACKEND_DIR / "data" / "council.sqlite3"
DEFAULT_AUDIO_DIR = BACKEND_DIR / "data" / "audio"
DEFAULT_FRONTEND_DIST = COUNCIL_DIR / "frontend" / "dist"
DEFAULT_LOCAL_ENV_PATH = BACKEND_DIR / ".env.local"


def _load_env_value(path: Path, name: str) -> str | None:
    """Read one env value without logging or returning unrelated file contents."""
    if not path.is_file():
        return None
    try:
        for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() == name:
                return value.strip().strip('"').strip("'") or None
    except OSError:
        return None
    return None


def resolve_openai_api_key() -> str | None:
    key = os.getenv("OPENAI_API_KEY")
    if key:
        return key

    configured_path = os.getenv("ASHENSPIRE_ITM3_ENV_FILE")
    env_path = Path(configured_path) if configured_path else DEFAULT_LOCAL_ENV_PATH
    return _load_env_value(env_path, "OPENAI_API_KEY")


@dataclass(frozen=True, slots=True)
class Settings:
    participants_path: Path = DEFAULT_PARTICIPANTS_PATH
    database_path: Path = DEFAULT_DATABASE_PATH
    audio_dir: Path = DEFAULT_AUDIO_DIR
    frontend_dist: Path = DEFAULT_FRONTEND_DIST
    agent_model: str = os.getenv("OPENAI_AGENT_MODEL", "gpt-5.6-luna")
    tts_model: str = os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
    transcription_model: str = os.getenv(
        "OPENAI_TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe"
    )
