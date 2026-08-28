export type Lifecycle = 'active' | 'supporting' | 'legacy'

export interface JournalEntry {
  id: string
  participant_id?: string
  content: string
  created_at: string
  source_type?: 'user_supplied_fact' | 'recorded_utterance' | 'verified_evidence'
  evidence?: string
  truth_status?: string
}

export interface Participant {
  id: string
  name: string
  initials: string
  role: string
  team: string
  voice_id: string
  voice_label: string
  lifecycle: Lifecycle
  authority_boundary: string
  boundaries: string[]
  traits: string[]
  journal: JournalEntry[]
  ai_disclosure: string
  tier?: string
  canonical_task_id?: string
}

export interface TranscriptItem {
  id: string
  speaker: string
  participant_id?: string
  text: string
  created_at: string
  audio_url?: string
  kind: 'user' | 'agent' | 'system'
}

export interface Meeting {
  id: string
  title: string
  agenda?: string
  participant_ids: string[]
  transcript?: TranscriptItem[]
}

export interface TurnResponse {
  meeting_id?: string
  responses: TranscriptItem[]
}
