# Pointer-first execution packet

## Improved prompt

> Build and verify a preview candidate for AshenSpire Council using current filesystem and Git evidence as the source of truth. Establish and document the `main`, `dev`, `feature/*`, `test`, and `release` branch model. Produce a reproducible preview artifact with an exact SHA-256 receipt and provide the repository pointer when publishing authority and authentication allow it. Use `POINTER | SCOPE | BRANCH | EVIDENCE | PREVIEW | DOCS | GATES | NEXT | AUTH` receipts instead of relying on conversational memory. Preserve secrets and unrelated files. Do not infer that a branch, green test, preview, or agreement authorizes merge, deployment, release, board mutation, or publication beyond this explicitly requested repository and preview scope.

## Current receipt

| Field | Value |
|---|---|
| POINTER | Local repository `C:\Users\const\Documents\Codex\2026-08-27\ashenspire-itm-pm-joint-meeting\outputs\ashenspire-council` plus `artifacts/preview-manifest.json` |
| SCOPE | Local voice-meeting application, participant registry, docs, and preview packaging |
| BRANCH | Work occurs on `feature/preview-build`; promotion is feature → dev → test → release → main |
| EVIDENCE | `verify.ps1`, Git status, commit IDs, preview manifest, and runtime health |
| PREVIEW | `artifacts/ashenspire-council-preview-r1.zip`; exact SHA-256 in `artifacts/preview-manifest.json`; local runtime at `http://127.0.0.1:8421` |
| DOCS | README, branching, preview, authority, data, voice, and journal policies |
| GATES | Backend tests, frontend tests, TypeScript check, production build, secret scan, artifact hash |
| NEXT | Add API credits for generated turns; restore GitHub authentication for a hosted repository URL |
| AUTH | Repository creation and preview packaging requested; no release or production deployment claimed |

Update this receipt from exact command output whenever the candidate changes.
