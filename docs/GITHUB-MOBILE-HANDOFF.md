# GitHub mobile handoff

Run `start-github-mobile-handoff.ps1` from the repository root. The helper launches GitHub CLI’s official web device flow, extracts only the short-lived user code, and presents two locally rendered QR codes. Step 1 opens GitHub's documented passkey-specific browser login. Step 2 opens GitHub's official device-verification page after the phone browser is authenticated. GitHub CLI keeps polling until authorization succeeds or expires.

## Security boundary

- The first QR contains only `https://github.com/login?passkey=true`; the second contains only `https://github.com/login/device`.
- The short-lived user code is printed locally and copied by GitHub CLI.
- The OAuth device code and resulting access token are never placed in the QR, app source, logs, or browser URL.
- GitHub CLI remains responsible for secure credential storage.
- The helper does not claim an undocumented GitHub Mobile URI scheme. Whether the universal link opens GitHub Mobile or the phone browser is controlled by GitHub and the phone’s link settings.

GitHub’s documented device flow requires a browser verification URI and an eight-character code. The code normally expires after 15 minutes. This helper improves device handoff without altering or bypassing that protocol.

The passkey step works only when the GitHub account has a registered passkey available to the phone browser or its passkey provider. A phone unlock code that merely unlocks an existing GitHub Mobile session cannot authenticate a separate browser session.
