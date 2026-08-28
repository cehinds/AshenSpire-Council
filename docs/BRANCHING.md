# Branching and promotion

| Branch | Purpose | Entry gate | Exit gate |
|---|---|---|---|
| `main` | Stable production history | Approved release candidate | Explicit production/release authority |
| `dev` | Integrated development | Reviewed feature evidence | Integration checks pass |
| `feature/*` | One bounded change | Branch from current `dev` | Focused tests, docs, and review receipt |
| `test` | QA promotion lane | Exact integrated `dev` candidate | Functional and experience QA receipts |
| `release` | Release hardening | Exact QA-approved candidate | Security/currentness checks and Product Owner release decision |

Normal flow is `feature/*` → `dev` → `test` → `release` → `main`. Hotfixes require a separately documented exception. Branch creation, a clean merge, or green CI is evidence only and never release authority.

Every promotion receipt records source branch, destination branch, exact source and destination commits, test evidence, unresolved risks, and approving authority.
