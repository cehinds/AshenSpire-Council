# Voice Map

The API voice is the supported synthesis voice. The profile label and instructions create the stable local delivery profile. Repeated API voices are intentional; no full profile label is reused.

| Status | Role | Stable interface name | Initials | API voice | Unique profile label |
|---|---|---|---|---|---|
| Active | IT Manager III, Integration & Delivery | Rowan Vale | RV | `cedar` | `cedar-iron-compass` |
| Active | Project Management Lead | Mara Ellison | ME | `marin` | `marin-clear-horizon` |
| Active | Help Desk | Tamsin Reed | TR | `alloy` | `alloy-signal-desk` |
| Active | Review & Approval Hub | Iris North | IN | `ash` | `ash-gate-lantern` |
| Active | Data Architecture & Systems Lead | Elias Venn | EV | `ballad` | `ballad-schema-keystone` |
| Active | Game Design Lead | Nadia Quill | NQ | `coral` | `coral-player-compass` |
| Active | Art Lead | Sable Hart | SH | `echo` | `echo-visual-northstar` |
| Supporting | Art Maker & Review | Pax Alder | PA | `fable` | `fable-craft-proof` |
| Active | Writing Lead | Liora Fen | LF | `nova` | `nova-story-thread` |
| Active | Code Quality & Modernization Lead | Dorian Pike | DP | `onyx` | `onyx-refactor-sentinel` |
| Active | Application Maker | Keira Moss | KM | `sage` | `sage-build-bench` |
| Supporting | QA1 Functional Review | Jonas Flint | JF | `shimmer` | `shimmer-functional-lens` |
| Supporting | QA2 Experience Review | Amaya Frost | AF | `verse` | `verse-experience-lens` |
| Supporting | Incident & Defect Diagnosis | Silas Kern | SK | `alloy` | `alloy-root-cause-beacon` |
| Supporting | Art Audit Characters & Worlds | Vera Lark | VL | `ash` | `ash-worldform-audit` |
| Supporting | Art Audit Cards & Items | Orin Beck | OB | `ballad` | `ballad-itemproof-audit` |
| Supporting | Art Audit UI & Effects | Celeste Rook | CR | `coral` | `coral-interface-flare-audit` |
| Legacy | Legacy Application Candidate | Bram Hollow | BH | `echo` | `echo-archive-candidate` |

## Playback rules

- Announce and visibly label the role and stable name on every turn.
- Serialize playback by default so distinct profiles remain intelligible.
- Let Constantine stop, mute, and replay each participant independently.
- Keep a text transcript available; voice is presentation, not the source of record.
- If synthesis fails, retain the attributed text and mark audio unavailable.
- Do not describe a profile as a real person's voice, clone a real speaker, or imply human identity.

## Change control

Changing an API voice or instruction requires a registry revision. Never change a participant's `stable_id` to accomplish a voice change. Historical transcripts and journals retain the stable ID and should record the registry version used for their meeting.
