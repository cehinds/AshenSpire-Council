# Participant Registry Data Contract

## Canonical file

`data/participants.json` is the versioned source of truth for stable display identity, role classification, conservative authority text, and voice configuration.

## Top-level fields

| Field | Type | Rule |
|---|---|---|
| `schema_version` | string | Semantic version for this contract. |
| `registry_id` | string | Stable registry identifier. |
| `updated_on` | date string | Date of the registry revision. |
| `product_owner` | object | Names Constantine and records retained Product Owner authority. |
| `supported_voice_ids` | string array | Closed set of accepted OpenAI voice identifiers for this build. |
| `registry_rules` | object | Human-readable safety and interpretation rules. |
| `participants` | object array | Canonical participant records. |

## Participant fields

| Field | Type | Required rule |
|---|---|---|
| `stable_id` | string | Unique, immutable, lower-case dotted identifier. Never recycle it for a different role. |
| `role` | string | Canonical organizational role label. |
| `personal_name` | string | Stable fictional interface name for recognition; it does not assert human identity. |
| `initials` | string | Unique two-letter display mark in this registry revision. |
| `team` | string | Organizational grouping. |
| `tier` | string | Functional classification, not authority rank. |
| `status` | enum | Exactly `active`, `supporting`, or `legacy`. |
| `canonical_task_id` | string or null | Exact task pointer only when established by supplied evidence; otherwise `null`. |
| `voice` | object | API voice, unique local profile label, and delivery instructions. |
| `traits` | string array | Communication guidance only. |
| `authority` | object | Explicit `may` and `must_not` arrays. Absence of a permission is not a grant. |
| `source_basis` | string array | Provenance of role, pointer, and authority claims. |
| `ai_disclosure` | string | Required plain-language disclosure of AI status. |

## Voice fields

| Field | Type | Rule |
|---|---|---|
| `api_voice_id` | string | Must be a member of `supported_voice_ids`. Reuse is allowed. |
| `voice_profile_label` | string | Unique across every participant, including participants sharing an API voice. |
| `instructions` | string | Unique communication direction; must not claim an accent, biography, emotion, consciousness, or imitation of a real person. |

## Identity and update rules

- `stable_id` is the durable foreign key for transcripts, meetings, journals, preferences, and receipts.
- Names and voice settings may change only through an explicit registry revision; historical journal records continue to reference the original `stable_id`.
- A canonical task pointer can move from `null` to an exact value only when a verified source establishes it.
- Do not store an API key or any secret in this file.
- Do not use a role's voice ID as a uniqueness key.
- Do not infer authority from `tier`, `team`, name, status, or voice.

## Minimum validation

The application must reject a registry that violates any of these conditions:

- Duplicate `stable_id`, `personal_name`, `initials`, or `voice_profile_label`.
- Unsupported `api_voice_id`.
- Status outside the three-value enum.
- Missing AI disclosure, source basis, voice instructions, or authority boundary.
- Empty `must_not` authority list.
- A task pointer that is blank text rather than a verified identifier or `null`.

## Forward compatibility

Additive optional fields require a minor schema version. Breaking field or meaning changes require a major version. Consumers must fail clearly on unsupported major versions and preserve unknown additive fields when round-tripping data.
