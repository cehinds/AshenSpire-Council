# AshenSpire Council frontend

React, Vite, and TypeScript client for the AshenSpire Council voice-meeting service.

## Commands

```powershell
npm install
npm run dev
npm run build
npm test
```

The development server listens on `http://127.0.0.1:5173` and proxies `/api` to `http://127.0.0.1:8421`.

Set `VITE_API_BASE_URL` only when the API is hosted somewhere else. Do not place `OPENAI_API_KEY` or any other secret in a `VITE_` variable: Vite exposes those values to browser code. The frontend intentionally calls only the server-side API.

## API use

- `GET /api/participants` loads the stable role registry.
- `POST /api/meetings` creates a meeting from the selected participant IDs.
- `POST /api/meetings/{id}/turn` submits Constantine's text and receives attributed agent responses with optional audio URLs.
- `POST /api/transcribe` accepts the browser microphone recording as multipart field `file`.
- `POST /api/participants/{id}/journal` records an explicitly user-supplied journal note.

Every represented participant is labeled as an AI role simulation. Journals display only recorded evidence or user-supplied notes; the UI never infers memories.

## Installable static build

The GitHub Pages build is an installable PWA. `../verify.ps1` builds the normal local-backend client first, then creates a separate `VITE_DEMO_MODE=true` Pages build and verifies its generated manifest, service worker, icons, install/update wiring, and static security boundary.

The installed Pages build remains a backendless demonstration. Its participant data and labeled sample replies are bundled, and demo journals use browser-local storage. Live agent turns, microphone transcription, generated speech, SQLite persistence, and secret handling require the local FastAPI backend. Never add `OPENAI_API_KEY` or another secret to frontend source, `VITE_` variables, the web manifest, or service-worker caches.

Installation and update instructions are in [docs/INSTALLABLE-APP.md](../docs/INSTALLABLE-APP.md).
