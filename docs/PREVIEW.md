# Preview build

Run `build-preview.ps1` from the repository root. It verifies the backend and frontend, builds the production frontend, stages only portable application files, creates `artifacts/ashenspire-council-preview-r1.zip`, and records its SHA-256 in `artifacts/preview-manifest.json`.

The preview includes source, the compiled frontend, participant data, documentation, and launch/verification scripts. It excludes API keys, SQLite data, generated audio, virtual environments, package caches, and `node_modules`.

To run the unpacked preview, provide `OPENAI_API_KEY`, `ASHENSPIRE_ITM3_ENV_FILE`, or `backend/.env.local`, then run `start.ps1`. The roster and records work locally without a successful generated turn. Generated responses currently require API credits.

The preview is not a release, deployment, or hosted production service.

## GitHub Pages

The `dev` branch deploys a backendless static demonstration through `.github/workflows/pages.yml`. It bundles the public participant registry and supports roster selection, static attributed sample responses, and browser-local journal notes. It never embeds or calls with an OpenAI API key. Live AI reasoning, transcription, and assigned voice playback remain local-backend capabilities.

The deployed static build is installable as a PWA on supported desktop and mobile browsers. A successful first online load allows the browser to cache its public static shell for later reopening; a cold device cannot install it offline. Only public static build assets are cacheable. Backend `/api` and `/audio` routes are excluded, and registration is disabled for the localhost application started by `start.ps1`. Offline installation does not add a backend or synchronize device-local notes. Installation, update, removal, and pointer-first receipt instructions are in [INSTALLABLE-APP.md](INSTALLABLE-APP.md).

`verify.ps1` first tests and builds the normal local-backend client, then produces a separate `VITE_DEMO_MODE=true` Pages build. It validates the generated PWA artifacts and scans that static build for secrets, machine paths, database/audio artifacts, and backend endpoints. That local gate is evidence about the candidate files only; the exact feature head, `dev` ancestry, successful Pages workflow run, and hosted manifest/service-worker HTTP and MIME readback must still be recorded separately.
