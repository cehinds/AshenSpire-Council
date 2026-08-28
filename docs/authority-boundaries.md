# Authority Boundaries

## Governing rule

The application records and communicates authority; it does not create authority. Meeting discussion, consensus, recommendations, status labels, generated speech, and journal entries are not authorization to mutate repositories, boards, automations, deployments, deliveries, merges, publications, or releases.

## Retained decision boundaries

| Actor or role | May | Does not gain from this app |
|---|---|---|
| Constantine | Make Product Owner decisions | No implicit technical validation or completed delivery from a spoken decision alone |
| Project Management Lead | Recommend portfolio order and capacity | Final technical operating-priority, integration, implementation, merge, deployment, release, or Product Owner authority |
| IT Manager III, Integration & Delivery | Make final technical operating-priority, integration, and implementation decisions within assigned authority | Product Owner authority or automatic permission to push, merge, deploy, release, or mutate boards or automations |
| Help Desk | Intake, deduplication, audit, and routing | Scope approval, technical integration, merge, deployment, release, or Product Owner authority |
| Review & Approval Hub | Coordinate review packets and record explicit authorized dispositions | Approval by proxy or by silence |
| Domain leads | Advise, define contracts, and recommend within their domains | Product, integration, merge, deployment, release, or portfolio authority unless separately granted |
| Makers | Perform explicitly scoped creation or implementation and proportionate local verification | Scope expansion, self-approval, push, merge, deployment, release, or board mutation |
| QA and audit roles | Independently inspect and report evidence, including pass, fail, blocked, and unknown | Approval beyond their review surface; a pass is not integration or release |
| Incident & Defect Diagnosis | Diagnose and recommend bounded remediation | Implementation without scope, or approval and delivery authority |
| Legacy Application Candidate | Supply historical evidence and compatibility analysis | Current operational or decision authority |

## Meeting rules

- A facilitator relays rather than substitutes for a participant.
- The same bounded packet goes to all selected decision participants; role-specific additions must be minimal.
- Each response is attributed to its actual role and stable participant ID.
- Silence, idle state, failure, or an ended task is reported as no response, never assent.
- Agreement is summarized separately from differences.
- A decision summary must name the authorized decision-maker, exact scope, owner, next gate, and receipt when available.
- When authority is ambiguous, the meeting records an unresolved question and routes it to the appropriate owner.

## Delivery-state vocabulary

Use distinct states and do not collapse them:

1. **Discussed** — appeared in meeting conversation.
2. **Recommended** — proposed by an advisory role.
3. **Decided** — explicitly selected by the authorized decision-maker.
4. **Authorized** — scoped permission for a specific action was explicitly granted.
5. **Implemented** — work exists in a named local or remote evidence surface.
6. **Verified** — defined checks passed against an identified artifact.
7. **Integrated** — accepted into the intended integration target.
8. **Delivered** — reached the authorized delivery surface.
9. **Released** — explicitly approved and published as a release.

No state implies a later state.

## Conflict handling

- Product scope conflict routes to Constantine.
- Portfolio order or capacity uncertainty routes to the Project Management Lead for a recommendation.
- Technical operating priority, integration, or implementation conflict routes to IT Manager III within their assigned authority.
- Intake, duplication, or receipt gaps route to Help Desk.
- Specialized quality findings remain recommendations or gate evidence until the authorized owner disposes them.
