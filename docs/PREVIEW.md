# Preview build

Run `build-preview.ps1` from the repository root. It verifies the backend and frontend, builds the production frontend, stages only portable application files, creates `artifacts/ashenspire-council-preview-r1.zip`, and records its SHA-256 in `artifacts/preview-manifest.json`.

The preview includes source, the compiled frontend, participant data, documentation, and launch/verification scripts. It excludes API keys, SQLite data, generated audio, virtual environments, package caches, and `node_modules`.

To run the unpacked preview, provide `OPENAI_API_KEY`, `ASHENSPIRE_ITM3_ENV_FILE`, or `backend/.env.local`, then run `start.ps1`. The roster and records work locally without a successful generated turn. Generated responses currently require API credits.

The preview is not a release, deployment, or hosted production service.

## GitHub Pages

The `dev` branch deploys a backendless static demonstration through `.github/workflows/pages.yml`. It bundles the public participant registry and supports roster selection, static attributed sample responses, and browser-local journal notes. It never embeds or calls with an OpenAI API key. Live AI reasoning, transcription, and assigned voice playback remain local-backend capabilities.
