# Pointer-first execution packet

## Improved prompt

> Build and verify a preview candidate for AshenSpire Council using current filesystem and Git evidence as the source of truth. Establish and document the `main`, `dev`, `feature/*`, `test`, and `release` branch model. Produce a reproducible preview artifact with an exact SHA-256 receipt and provide the repository pointer when publishing authority and authentication allow it. Use `POINTER | SCOPE | BRANCH | EVIDENCE | PREVIEW | DOCS | GATES | NEXT | AUTH` receipts instead of relying on conversational memory. Preserve secrets and unrelated files. Do not infer that a branch, green test, preview, or agreement authorizes merge, deployment, release, board mutation, or publication beyond this explicitly requested repository and preview scope.

## Current receipt

| Field | Value |
|---|---|
| POINTER | Local repository `C:\Users\const\Documents\Codex\2026-08-27\ashenspire-itm-pm-joint-meeting\outputs\ashenspire-council` plus `artifacts/preview-manifest.json` |
| SCOPE | Local voice-meeting application, installable backendless Pages PWA, participant registry, docs, and preview packaging |
| BRANCH | Current candidate: `{exact branch}` at `{40-character commit SHA}`; promotion remains feature → dev → test → release → main |
| EVIDENCE | `verify.ps1`, Git status, commit IDs, preview manifest, and runtime health |
| PREVIEW | Portable ZIP: `artifacts/ashenspire-council-preview-r1.zip` with SHA-256 in `artifacts/preview-manifest.json`; local runtime: `http://127.0.0.1:8421`; installable Pages candidate: `https://cehinds.github.io/AshenSpire-Council/` |
| DOCS | README, branching, preview, installable-app, authority, data, voice, and journal policies |
| GATES | Backend tests, frontend tests, TypeScript check, normal production build, static Pages build, PWA artifact/install wiring checks, secret/machine-path/database/audio/backend-endpoint scans, artifact hash; deployment requires feature-head → `dev` ancestry, workflow, Pages API, and hosted HTTP/MIME evidence |
| NEXT | Fill `{exact branch}`, `{40-character feature head}`, `{origin/dev descendant PASS}`, `{workflow run URL}`, hosted manifest/SW readback, and verification timestamp from physical evidence; add API credits separately for local generated turns |
| AUTH | Installable Pages preview requested; no promotion, production release, or backend deployment claimed |

Update this receipt and the installation receipt in [INSTALLABLE-APP.md](INSTALLABLE-APP.md) from exact command output whenever the candidate changes. A placeholder is a declared unknown, not evidence.
