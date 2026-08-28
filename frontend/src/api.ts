import type { JournalEntry, Meeting, Participant, TranscriptItem, TurnResponse } from './types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

const text = (...values: unknown[]) => values.find((value) => typeof value === 'string' && value.length) as string | undefined

function normalizeJournal(raw: unknown, index: number): JournalEntry {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: text(item.id, item.entry_id) ?? `journal-${index}`,
    participant_id: text(item.participant_id),
    content: text(item.content, item.note, item.text) ?? '',
    created_at: text(item.created_at, item.timestamp, item.date) ?? new Date().toISOString(),
    source_type: (item.source_type ?? item.kind) as JournalEntry['source_type'],
    evidence: text(item.evidence, item.verification),
    truth_status: text(item.truth_status),
  }
}

export function normalizeParticipant(raw: unknown): Participant {
  const item = raw as Record<string, unknown>
  const voice = item.voice as Record<string, unknown> | string | undefined
  const rawTraits = item.traits
  const rawJournal = item.journal ?? item.journal_entries
  const rawLifecycle = text(item.lifecycle, item.status)
  const lifecycle = rawLifecycle === 'legacy' || item.active === false ? 'legacy' : rawLifecycle === 'supporting' ? 'supporting' : 'active'
  return {
    id: text(item.id, item.stable_id, item.participant_id) ?? crypto.randomUUID(),
    name: text(item.name, item.display_name) ?? 'Unnamed participant',
    initials: text(item.initials) ?? text(item.name, item.display_name)?.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? 'AS',
    role: text(item.role, item.title) ?? 'AshenSpire team member',
    team: text(item.team, item.team_name) ?? 'AshenSpire',
    voice_id: typeof voice === 'string' ? voice : text(item.voice_id, voice?.id, voice?.name) ?? 'alloy',
    voice_label: typeof voice === 'string' ? voice : text(voice?.label, voice?.id, voice?.name) ?? 'alloy',
    lifecycle,
    authority_boundary: text(item.authority, item.authority_boundary, item.scope) ?? 'No authority boundary recorded.',
    boundaries: Array.isArray(item.boundaries) ? item.boundaries.map(String) : [],
    traits: Array.isArray(rawTraits) ? rawTraits.map(String) : text(rawTraits)?.split(',').map((part) => part.trim()).filter(Boolean) ?? [],
    journal: Array.isArray(rawJournal) ? rawJournal.map(normalizeJournal) : [],
    ai_disclosure: text(item.ai_disclosure) ?? 'AI role simulation — not a human participant.',
    tier: text(item.tier),
    canonical_task_id: text(item.canonical_task_id),
  }
}

function normalizeTranscript(raw: unknown, index: number): TranscriptItem {
  const item = raw as Record<string, unknown>
  const speaker = text(item.speaker, item.speaker_name, item.name) ?? 'Council'
  const kind = item.kind === 'user' || item.role === 'user' ? 'user' : item.kind === 'system' ? 'system' : 'agent'
  return {
    id: text(item.id, item.turn_id, item.message_id) ?? `turn-${Date.now()}-${index}`,
    speaker,
    participant_id: text(item.participant_id, item.speaker_id, item.agent_id),
    text: text(item.text, item.content, item.message) ?? '',
    created_at: text(item.created_at, item.timestamp) ?? new Date().toISOString(),
    audio_url: text(item.audio_url, item.audio),
    kind,
  }
}

export async function getParticipants(): Promise<Participant[]> {
  const data = await request<unknown>('/api/participants')
  const list = Array.isArray(data) ? data : ((data as { participants?: unknown[] }).participants ?? [])
  return list.map(normalizeParticipant)
}

export async function createMeeting(participantIds: string[]): Promise<Meeting> {
  const raw = await request<Record<string, unknown>>('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participant_ids: participantIds, title: 'Joint operating review', agenda: 'Priority order, blockers, authority' }),
  })
  const meeting = (raw.meeting ?? raw) as Record<string, unknown>
  return {
    id: text(meeting.id, meeting.meeting_id) ?? '',
    title: text(meeting.title) ?? 'Joint operating review',
    agenda: text(meeting.agenda),
    participant_ids: (meeting.participant_ids as string[] | undefined) ?? participantIds,
    transcript: Array.isArray(meeting.entries) ? meeting.entries.map(normalizeTranscript) : [],
  }
}

export async function submitTurn(meetingId: string, message: string): Promise<TurnResponse> {
  const raw = await request<Record<string, unknown>>(`/api/meetings/${encodeURIComponent(meetingId)}/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  })
  const list = raw.responses ?? []
  return { meeting_id: text(raw.meeting_id), responses: Array.isArray(list) ? list.map(normalizeTranscript) : [] }
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData()
  form.append('file', blob, `recording.${blob.type.includes('webm') ? 'webm' : 'wav'}`)
  const raw = await request<Record<string, unknown>>('/api/transcribe', { method: 'POST', body: form })
  return text(raw.text, raw.transcript) ?? ''
}

export async function addJournalEntry(participantId: string, content: string): Promise<JournalEntry> {
  const raw = await request<Record<string, unknown>>(`/api/participants/${encodeURIComponent(participantId)}/journal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  return normalizeJournal(raw.entry ?? raw, 0)
}

export async function getJournal(participantId: string): Promise<JournalEntry[]> {
  const raw = await request<Record<string, unknown>>(`/api/participants/${encodeURIComponent(participantId)}/journal`)
  const entries = Array.isArray(raw.entries) ? raw.entries : []
  return entries.map(normalizeJournal).reverse()
}
