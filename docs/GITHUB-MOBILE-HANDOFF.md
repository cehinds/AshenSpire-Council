# GitHub mobile handoff

Run `start-github-mobile-handoff.ps1` from the repository root. The helper launches GitHub CLI’s official web device flow, extracts only the short-lived user code from GitHub CLI output, renders GitHub’s official verification URL as a QR code locally in the terminal, and keeps GitHub CLI polling until authorization succeeds or expires.

## Security boundary

- The QR contains only `https://github.com/login/device`.
- The short-lived user code is printed locally and copied by GitHub CLI.
- The OAuth device code and resulting access token are never placed in the QR, app source, logs, or browser URL.
- GitHub CLI remains responsible for secure credential storage.
- The helper does not claim an undocumented GitHub Mobile URI scheme. Whether the universal link opens GitHub Mobile or the phone browser is controlled by GitHub and the phone’s link settings.

GitHub’s documented device flow requires a browser verification URI and an eight-character code. The code normally expires after 15 minutes. This helper improves device handoff without altering or bypassing that protocol.
