import { BookOpenText, Menu, Plus, Settings, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { addJournalEntry, createMeeting, getJournal, getParticipants, submitTurn, transcribeAudio } from './api'
import { Inspector } from './components/Inspector'
import { Mark } from './components/Mark'
import { MeetingCenter } from './components/MeetingCenter'
import { Roster } from './components/Roster'
import { useAudioQueue } from './hooks/useAudioQueue'
import { useRecorder } from './hooks/useRecorder'
import type { JournalEntry, Lifecycle, Meeting, Participant, TranscriptItem } from './types'

export function App() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [inspectedId, setInspectedId] = useState<string>()
  const [filter, setFilter] = useState<Lifecycle>('active')
  const [search, setSearch] = useState('')
  const [meeting, setMeeting] = useState<Meeting>()
  const [transcript, setTranscript] = useState<TranscriptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>()
  const audio = useAudioQueue()

  useEffect(() => {
    void getParticipants().then((items) => {
      setParticipants(items)
      const active = items.filter((item) => item.lifecycle === 'active')
      setSelectedIds(active.slice(0, 2).map((item) => item.id))
      setInspectedId(active[0]?.id ?? items[0]?.id)
    }).catch((cause: Error) => setError(cause.message)).finally(() => setLoading(false))
  }, [])

  const inspected = useMemo(() => participants.find((item) => item.id === inspectedId), [participants, inspectedId])

  useEffect(() => {
    if (!inspectedId) return
    void getJournal(inspectedId).then((journal) => {
      setParticipants((items) => items.map((participant) => participant.id === inspectedId ? { ...participant, journal } : participant))
    }).catch((cause: Error) => setError(cause.message))
  }, [inspectedId])

  async function beginMeeting() {
    if (!selectedIds.length) {
      setError('Select at least one participant before creating a meeting.')
      return
    }
    setCreating(true)
    setError(undefined)
    try {
      const created = await createMeeting(selectedIds)
      setMeeting(created)
      setTranscript(created.transcript ?? [])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Meeting creation failed.') }
    finally { setCreating(false) }
  }

  async function send(message: string) {
    setSending(true)
    setError(undefined)
    try {
      let activeMeeting = meeting
      if (!activeMeeting) {
        activeMeeting = await createMeeting(selectedIds)
        setMeeting(activeMeeting)
      }
      const userEntry: TranscriptItem = { id: crypto.randomUUID(), speaker: 'Constantine', text: message, created_at: new Date().toISOString(), kind: 'user' }
      setTranscript((items) => [...items, userEntry])
      const result = await submitTurn(activeMeeting.id, message)
      setTranscript((items) => [...items, ...result.responses])
      audio.playSequence(result.responses.filter((item): item is TranscriptItem & { audio_url: string } => Boolean(item.audio_url)).map((item) => ({ id: item.id, url: item.audio_url })))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The council could not respond.') }
    finally { setSending(false) }
  }

  const recorder = useRecorder(async (blob) => {
    setError(undefined)
    try {
      const text = await transcribeAudio(blob)
      if (text.trim()) await send(text)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Transcription failed.') }
  })

  async function addNote(participantId: string, content: string): Promise<JournalEntry> {
    const entry = await addJournalEntry(participantId, content)
    setParticipants((items) => items.map((participant) => participant.id === participantId ? { ...participant, journal: [entry, ...participant.journal] } : participant))
    return entry
  }

  function toggleParticipant(participant: Participant) {
    setSelectedIds((ids) => ids.includes(participant.id) ? ids.filter((id) => id !== participant.id) : [...ids, participant.id])
  }

  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href="#meeting"><Mark /><span>AshenSpire Council</span></a>
      <nav aria-label="Primary navigation">
        <a className="active" href="#meeting"><UsersRound size={20} /> Meeting</a>
        <a href="#roster"><Menu size={20} /> Roster</a>
        <a href="#identity"><BookOpenText size={20} /> Records</a>
      </nav>
      <div className="header-actions"><button className="new-meeting" onClick={() => void beginMeeting()} disabled={creating}><Plus size={19} /> {creating ? 'Creating…' : 'New meeting'}</button><button className="icon-button" aria-label="Settings"><Settings size={21} /></button></div>
    </header>
    {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError(undefined)} aria-label="Dismiss error">×</button></div>}
    <div className="workspace">
      <Roster participants={participants} selectedIds={selectedIds} inspectedId={inspectedId} filter={filter} search={search} loading={loading} onFilter={setFilter} onSearch={setSearch} onSelect={toggleParticipant} onInspect={(participant) => setInspectedId(participant.id)} />
      <MeetingCenter meeting={meeting} participants={participants} selectedCount={selectedIds.length} transcript={transcript} sending={sending} recording={recorder.isRecording} transcribing={recorder.isTranscribing} activeAudioId={audio.activeId} isPlaying={audio.isPlaying} onSend={send} onRecord={async () => { try { await recorder.toggle() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Microphone access failed.') } }} onPlay={(entry) => entry.audio_url && audio.playOne({ id: entry.id, url: entry.audio_url })} onToggleActive={audio.toggleActive} />
      <Inspector participant={inspected} onAddJournal={addNote} />
    </div>
  </div>
}
