# Factual Journal Policy

## Purpose

Each participant may have a persistent work journal so later meetings can recover verified context without inventing personal memory. The journal is an append-only evidence log associated with a stable AI role persona. It is not a diary of feelings, private life, consciousness, or autobiography.

## Required entry fields

Every journal entry must contain:

| Field | Meaning |
|---|---|
| `entry_id` | Unique immutable record identifier. |
| `participant_stable_id` | Exact participant foreign key from the registry. |
| `recorded_at` | Timestamp with timezone for when the entry was appended. |
| `event_at` | Timestamp or bounded date for the underlying event, when known. |
| `evidence_class` | Exactly `user_supplied_fact`, `recorded_agent_utterance`, or `verified_evidence`. |
| `statement` | Concise factual record in neutral language. |
| `source` | Human-readable source type and origin. |
| `meeting_or_receipt_pointer` | Exact meeting, task, ticket, file, URL, or receipt pointer; use an explicit `unknown` marker only when the source cannot provide one. |
| `confidence` | `high`, `medium`, or `low`, with a short rationale. |
| `registry_version` | Participant registry schema or content version used. |
| `supersedes_entry_id` | Prior entry corrected by this entry, or `null`. |

## Evidence-class meanings

### `user_supplied_fact`

A statement Constantine or another identified user supplied. Record attribution and source pointer. It remains user-supplied until independently verified; do not upgrade it by repetition.

### `recorded_agent_utterance`

Something an AI participant actually stated in an attributed meeting turn. Record the transcript or receipt pointer. This proves the utterance occurred, not that its factual claims are true or approved.

### `verified_evidence`

A claim checked against an identified evidence surface with a recorded method and result. The statement must name the bounded fact verified. A screenshot verifies visible pixels only unless paired with behavior, input, or state evidence.

## Append-only rules

- Append new records; do not edit or delete earlier entries silently.
- Correct a mistake with a new entry whose `supersedes_entry_id` points to the prior entry.
- Preserve original timestamps, attribution, source pointers, and confidence.
- A later summary may project the current view but must retain links to every contributing and superseded entry.
- Journal imports must preserve their original source and must not be relabeled as locally verified.

## Prohibited content and inference

Do not create or store:

- Inferred memories, feelings, desires, relationships, preferences, lived experiences, or autobiographical events.
- Claims that a participant remembers, witnessed, believed, wanted, or felt something unless the record is explicitly an attributed utterance—and even then record it only as an utterance, not proof of inner state.
- Guessed task pointers, approvals, owners, deadlines, identity details, or authority.
- Secrets, API keys, credentials, private tokens, or unnecessary personal data.
- Reconstructed meeting content that was not actually captured.

Preferred language is factual: “In meeting M, participant P stated X.” Avoid anthropomorphic language such as “P remembers X” or “P has always cared about X.”

## Authority and decision recording

- A recommendation is recorded as a recommendation from its source role.
- A decision is recorded only when the authorized decision-maker explicitly makes it.
- Silence is never recorded as assent.
- A QA pass, reviewer disposition, or participant agreement does not become integration, merge, delivery, or release evidence.
- Product Owner decisions must identify Constantine as the decision source.
- Technical operating-priority or integration decisions must identify IT Manager III and remain within the recorded authority scope.

## Example entry

```json
{
  "entry_id": "journal-example-0001",
  "participant_stable_id": "ashenspire.pm.portfolio-lead",
  "recorded_at": "2026-08-27T12:00:00-08:00",
  "event_at": "2026-08-27",
  "evidence_class": "recorded_agent_utterance",
  "statement": "The Project Management Lead recommended reviewing capacity before changing portfolio order.",
  "source": "Attributed meeting transcript turn",
  "meeting_or_receipt_pointer": "meeting-example",
  "confidence": {
    "level": "high",
    "rationale": "The utterance is present in the attributed transcript."
  },
  "registry_version": "1.0.0",
  "supersedes_entry_id": null
}
```

This example proves only that the recommendation was uttered. It does not prove acceptance, authorization, implementation, or delivery.
