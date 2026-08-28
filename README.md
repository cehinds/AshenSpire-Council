# AshenSpire Council

AshenSpire Council is a local multi-agent voice-meeting application for Constantine. It provides eighteen stable AI role identities, persistent voice profiles, attributed transcripts, explicit authority boundaries, and factual work journals.

Every participant is visibly identified as an AI role simulation. Personal names and traits are stable presentation profiles; they do not imply human identity, consciousness, private experience, or autobiographical memory.

## What is included

- React and TypeScript meeting interface with roster selection, microphone capture, transcript attribution, sequential audio playback, and participant inspection.
- FastAPI backend using the OpenAI Agents SDK, transcription API, and per-role text-to-speech.
- SQLite meeting and journal persistence.
- Eighteen participants linked to their canonical AshenSpire task pointers.
- Thirteen supported OpenAI voices and eighteen unique voice-profile labels.
- Authority and journal policies under `docs/`.

The canonical Codex task identifiers are reference pointers. This application does not send messages to, mutate, or impersonate those Codex tasks; it runs stable API-backed role personas using the recorded role contracts.

## Start the app

Requirements: Node.js, npm, Python 3.11 or newer, and `uv`.

From this directory:

```powershell
.\start.ps1
```

Then open [http://127.0.0.1:8421](http://127.0.0.1:8421). Keep the terminal open while using the app; press `Ctrl+C` to stop it.

The backend loads `OPENAI_API_KEY` from the environment first. On this workstation it can also read the approved IT Manager III workspace `.env.local` file. The key is never exposed to browser code.

The key is configured, but the selected API project currently reports `credit_balance_exhausted`. Add API credits at [OpenAI billing](https://platform.openai.com/settings/organization/billing) before generated agent speech will run. ChatGPT subscriptions and API billing are separate.

## Verify

```powershell
.\verify.ps1
```

This runs backend tests, frontend tests, the TypeScript check, and the production build.

## Data boundaries

- User-supplied journal notes are labeled as user-supplied facts.
- Agent responses are stored as recorded meeting utterances, not verified project facts.
- Verified evidence requires an explicit receipt or source pointer.
- No journal entry is inferred as a memory.
- Discussion never grants merge, deployment, release, board, automation, repository, or Product Owner authority.

## Project layout

- `backend/` — FastAPI, Agents SDK, SQLite, transcription, and speech generation.
- `frontend/` — React/Vite application and production build.
- `data/participants.json` — stable participant and voice registry.
- `docs/` — build brief, contracts, authority boundaries, voice map, and journal policy.
- `design-concept.png` — accepted visual specification.
