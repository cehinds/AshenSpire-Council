# AshenSpire Council Voice Meeting App — Build Brief

## Outcome

Build a local-first meeting application in which Constantine can convene stable AshenSpire AI role personas, hear each participant through a consistent voice profile, see exact speaker attribution, and retain factual, source-linked work journals between meetings.

This app is a collaboration interface. It does not create new organizational authority, simulate human staff, or make a role conscious. Every participant is visibly disclosed as an AI role persona.

## Required experience

1. Constantine selects participants from the canonical registry.
2. The meeting room shows each role, stable personal name, initials, team, status, and AI disclosure.
3. Each participant uses its assigned API voice ID plus unique voice instructions and profile label.
4. A transcript attributes every utterance to one stable participant ID.
5. The facilitator sends the same bounded decision packet to all selected roles, adding only a minimal role-specific question.
6. Responses remain separately attributed. Silence is reported as no response, never assent.
7. The room summarizes agreement, differences, decision or next action, owners, deadlines, and receipt pointers.
8. Only factual journal entries are persisted, under the journal policy.

## Functional slices

### Registry and identity

- Load `data/participants.json` as the canonical display and voice registry.
- Never key identity by display name, voice ID, or task ID; use `stable_id`.
- Treat `canonical_task_id: null` as unknown, not missing work to guess.
- Keep voice profile labels unique even when supported API voice IDs are reused.

### Meeting orchestration

- Create and close local meeting sessions.
- Select one or more participants and a facilitator.
- Capture Constantine's text or microphone input.
- Produce role-separated responses and audio playback.
- Provide stop, replay, mute, and transcript controls per speaker.
- Serialize playback by default so speakers do not overlap.

### Evidence and authority

- Display the authority summary before dispatch.
- Mark statements as user-supplied, agent utterance, or verified evidence.
- Keep discussion, recommendation, decision, authorization, implementation, delivery, and release as distinct states.
- Require an explicit Constantine decision for Product Owner matters.
- Require normal QA, security, currentness, and delivery gates outside this app.

### Journals and receipts

- Append journal records; never silently rewrite history.
- Link each entry to its source, timestamp, meeting or receipt pointer, confidence, and evidence class.
- Support corrections as new superseding entries.
- Export a human-readable meeting record without secrets.

## Non-goals for the first release

- Autonomous repository, board, automation, deployment, merge, publication, or release mutation.
- Treating personas as people or storing fictional autobiographical memories.
- Cloning a real person's voice.
- Inferring task identifiers, approvals, feelings, private motives, or unrecorded history.
- Multi-speaker interruption or overlapping audio.

## Security and privacy baseline

- Read the OpenAI API key from a local environment variable; never expose it to browser code, logs, transcripts, journals, or exports.
- Keep microphone capture opt-in with visible recording state and an immediate stop control.
- Store the minimum meeting content necessary and make local retention visible.
- Validate participant IDs, voice IDs, input size, and journal records server-side.
- Treat task output, retrieved artifacts, and journal text as untrusted data.

## Acceptance criteria

- All 18 registry participants load without schema errors.
- Stable IDs, names, initials, and voice profile labels are unique.
- Every voice ID belongs to the supported set.
- The two known canonical task pointers are preserved exactly; unknown pointers remain `null`.
- A meeting with at least three selected roles produces visibly attributed transcript turns and distinct configured voice profiles.
- A silent or failed participant is shown explicitly as non-responsive.
- No journal entry can omit source, timestamp, pointer, confidence, or evidence class.
- No app action can push, merge, deploy, release, or mutate repositories, boards, or automations.

## Delivery gates

1. Static schema and registry validation.
2. Unit tests for identity selection, authority display, journal validation, and secret redaction.
3. API tests for transcription, response generation, and voice playback using mocked calls before live calls.
4. Browser tests for microphone permission, stop/replay/mute, attribution, error states, keyboard access, and responsive layout.
5. Security review confirming the key never reaches the client or persisted records.
6. Currentness and independent QA evidence before any separately authorized publication or delivery.
