# Contributing

1. Start from the current `dev` branch and create one `feature/<bounded-name>` branch.
2. Keep secrets in environment variables or ignored `.env.local` files.
3. Update the pointer-first receipt and relevant contracts with the change.
4. Run `verify.ps1`; add focused tests for changed behavior.
5. Open review toward `dev`. Promote separately through `test`, `release`, and `main` only with the required evidence and authority.

Do not conflate a local build, review approval, merge, hosted preview, deployment, and release.
