# Installable AshenSpire Council app

The GitHub Pages preview can be installed as a Progressive Web App (PWA). The installed app opens in its own window and keeps the same AshenSpire Council identity on that device.

Install from the dedicated site: [https://cehinds.github.io/AshenSpire-Council/](https://cehinds.github.io/AshenSpire-Council/)

## Install on a Windows PC

1. Open the site in current Microsoft Edge or Google Chrome.
2. Use the **Install AshenSpire Council** button when it is offered. If it is not visible, use the browser's address-bar install icon or open the browser menu and choose **Apps** → **Install AshenSpire Council**.
3. Confirm **Install**. Windows can then launch it from the Start menu like another app.

The browser decides when its native installation prompt is available. A missing prompt does not mean the site is broken; use the browser menu after the page has finished loading.

## Install on a phone or tablet

### Android

1. Open the site in current Chrome.
2. Tap **Install AshenSpire Council** when offered, or open Chrome's menu and choose **Install app** or **Add to Home screen**.
3. Confirm the installation.

### iPhone or iPad

1. Open the site in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**, then **Add**.

iOS controls this flow through Safari and may not display the same in-page install prompt as Chrome or Edge.

## What the installed Pages app can do

- Select from the bundled participant roster.
- Show clearly labeled static example responses.
- Store demo journal notes in that browser profile on that device.
- Reopen the cached static interface after it has loaded successfully online at least once.

The first successful online load installs the public static cache. A cold, never-loaded device cannot install or start the app offline. The Pages PWA is a backendless demonstration: offline mode does not add live AI reasoning, microphone transcription, generated speech, cross-device synchronization, or canonical-task communication. Browser-local journals are not verified evidence and can disappear when site data is cleared.

Only the public Pages application shell and its public build assets are cacheable. Backend `/api` and generated `/audio` routes are excluded. The registration helper also stays disabled on `127.0.0.1`, `localhost`, and `[::1]`, so the installed Pages service worker cannot intercept the full local application launched by `start.ps1`.

For the complete local application, clone or download the repository, configure the server-side `OPENAI_API_KEY`, and run `start.ps1`. The local FastAPI service provides live agent turns, transcription, assigned voice playback, SQLite persistence, and server-side secret handling. Those capabilities require the local backend, network access, and usable OpenAI API credit; installing the Pages PWA does not install or expose that backend.

## Updates

The installed app checks the Pages site for a newer static build when it is opened online. When a waiting build is ready, the app shows **Update available**; choose **Update now** to apply it. The service worker then activates and reloads the app. Updates are prompt-controlled and do not force a reload before that action. If the notice does not appear immediately after a deployment, close all app windows, reopen online, and allow the browser time to finish its update check.

An updated preview is still a preview. It does not imply promotion to `test`, `release`, or `main`, and does not grant release approval.

## Uninstall or reinstall

- **Windows Edge/Chrome:** open the installed app's menu and choose **Uninstall**, or remove it from the browser's app management page.
- **Android:** use the app icon's uninstall action or Android app settings.
- **iPhone/iPad:** touch and hold the Home Screen icon, then choose **Remove App** → **Delete App**.

Reinstall from the Pages URL. If troubleshooting requires a completely clean install, uninstall the app and clear site data for `cehinds.github.io` before reinstalling. Clearing site data deletes browser-local demo journals.

## Security boundary

- The deployed PWA is static and must contain no API key, access token, device code, SQLite database, or generated private meeting data.
- `OPENAI_API_KEY` belongs only in the local backend environment; never place it in a `VITE_` variable, source file, manifest, or service worker.
- The service worker may cache only public build assets and public navigation responses from the Pages app.
- Installed-app status is a browser capability, not proof of identity, authority, synchronization, approval, or release state.

## Pointer-first receipt

Do not rely on meeting memory to identify an installed build. Fill this receipt from Git and GitHub evidence for each published candidate:

| Field | Exact value |
|---|---|
| REPOSITORY | `https://github.com/cehinds/AshenSpire-Council` |
| PAGES | `https://cehinds.github.io/AshenSpire-Council/` |
| SOURCE_BRANCH | `{exact deployed branch}` |
| FEATURE_HEAD | `{40-character feature/installable-pwa commit SHA}` |
| DEV_DESCENDANT | `{PASS from git merge-base --is-ancestor FEATURE_HEAD origin/dev}` |
| SOURCE_COMMIT | `{40-character git commit SHA}` |
| WORKFLOW_RUN | `{exact GitHub Actions run URL}` |
| MANIFEST | `{deployed manifest URL and SHA-256 if recorded}` |
| SERVICE_WORKER | `{deployed service-worker URL and SHA-256 if recorded}` |
| VERIFIED_AT | `{ISO-8601 timestamp with timezone}` |
| VERIFY_COMMAND | `./verify.ps1` |
| RESULT | `{PASS or exact failing gate}` |
| SCOPE | `Installable backendless Pages preview; not local backend or release` |

An installation receipt is incomplete while any brace-delimited placeholder remains.

## Hosted verification after deployment

Local build checks do not prove what GitHub serves. After the feature head is integrated into `dev` and the Pages workflow succeeds, record the exact Git ancestry and hosted readback:

```powershell
git fetch origin dev
git rev-parse feature/installable-pwa
git rev-parse origin/dev
git merge-base --is-ancestor (git rev-parse feature/installable-pwa) origin/dev
if ($LASTEXITCODE -ne 0) { throw 'The deployed dev branch does not contain the verified feature head.' }

$manifestResponse = Invoke-WebRequest 'https://cehinds.github.io/AshenSpire-Council/manifest.webmanifest'
$workerResponse = Invoke-WebRequest 'https://cehinds.github.io/AshenSpire-Council/sw.js'
if ($manifestResponse.StatusCode -ne 200 -or $manifestResponse.Headers.'Content-Type' -notmatch 'application/(manifest\+json|json)') { throw 'Hosted manifest readback failed.' }
if ($workerResponse.StatusCode -ne 200 -or $workerResponse.Headers.'Content-Type' -notmatch '(application|text)/javascript') { throw 'Hosted service-worker readback failed.' }
$hostedManifest = $manifestResponse.Content | ConvertFrom-Json
if ($hostedManifest.id -ne '/AshenSpire-Council/' -or $hostedManifest.start_url -ne '/AshenSpire-Council/' -or $hostedManifest.scope -ne '/AshenSpire-Council/') { throw 'Hosted manifest identity or scope is wrong.' }

gh run list --repo cehinds/AshenSpire-Council --workflow pages.yml --branch dev --limit 1
gh api repos/cehinds/AshenSpire-Council/pages
```

The receipt needs the exact successful workflow URL and Pages API readback. Neither a local PASS nor a `dev` deployment implies promotion to `test`, `release`, or `main`.
