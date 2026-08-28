import { BookOpenText, Copy, Plus } from 'lucide-react'
import { FormEvent, useState } from 'react'
import type { JournalEntry, Participant } from '../types'

interface InspectorProps {
  participant?: Participant
  onAddJournal: (participantId: string, content: string) => Promise<JournalEntry>
}

export function Inspector({ participant, onAddJournal }: InspectorProps) {
  const [tab, setTab] = useState<'identity' | 'journal'>('identity')
  const [adding, setAdding] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  if (!participant) return <aside className="inspector panel"><p className="empty-state">Select a participant to inspect their verified identity.</p></aside>

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    try {
      await onAddJournal(participant!.id, note.trim())
      setNote('')
      setAdding(false)
    } finally { setSaving(false) }
  }

  return (
    <aside className="inspector panel" id="identity" aria-label="Participant identity">
      <h2>Participant identity</h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'identity'} className={tab === 'identity' ? 'active' : ''} onClick={() => setTab('identity')}>Identity</button>
        <button role="tab" aria-selected={tab === 'journal'} className={tab === 'journal' ? 'active' : ''} onClick={() => setTab('journal')}>Journal</button>
      </div>

      {tab === 'identity' ? (
        <div className="identity-fields" role="tabpanel">
          <div><dt>Stable ID</dt><dd><span>{participant.id}</span><button className="icon-button compact" onClick={() => void navigator.clipboard?.writeText(participant.id)} aria-label="Copy stable ID"><Copy size={15} /></button></dd></div>
          <div><dt>Role</dt><dd>{participant.role}</dd></div>
          <div><dt>Team</dt><dd>{participant.team}</dd></div>
          <div><dt>Voice</dt><dd><span className="voice-wave small" aria-hidden="true" /> {participant.voice_label}</dd></div>
          <div><dt>Authority</dt><dd>{participant.authority_boundary}</dd></div>
          {!!participant.boundaries.length && <div><dt>Boundaries</dt><dd>{participant.boundaries.join(' ')}</dd></div>}
          <div><dt>Traits</dt><dd>{participant.traits.join(', ') || 'No traits recorded.'}</dd></div>
          <div className="disclosure"><dt>Disclosure</dt><dd>{participant.ai_disclosure}</dd></div>
        </div>
      ) : (
        <div className="journal" role="tabpanel">
          <div className="journal-heading"><h3>Work journal</h3><button className="secondary-button" onClick={() => setAdding((value) => !value)}><Plus size={16} /> Add entry</button></div>
          {adding && <form className="journal-form" onSubmit={save}>
            <label>User-supplied note<textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record only what you know to be true…" /></label>
            <div><button type="button" className="text-button" onClick={() => setAdding(false)}>Cancel</button><button className="secondary-button" disabled={saving || !note.trim()}>{saving ? 'Saving…' : 'Save note'}</button></div>
          </form>}
          {!participant.journal.length && <p className="empty-state">No journal entries recorded.</p>}
          {participant.journal.map((entry) => <article className="journal-entry" key={entry.id}>
            <BookOpenText size={19} />
            <div><time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time><p>{entry.content}</p>{entry.evidence && <small>Evidence: {entry.evidence}</small>}</div>
          </article>)}
        </div>
      )}
      <div className="memory-note"><span aria-hidden="true">i</span> No inferred memories.</div>
    </aside>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
