import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { LoaderCircle, Mic, MoreHorizontal, Pause, Play, Send, Square, UsersRound } from 'lucide-react'
import type { Meeting, Participant, TranscriptItem } from '../types'

interface MeetingCenterProps {
  meeting?: Meeting
  participants: Participant[]
  selectedCount: number
  transcript: TranscriptItem[]
  sending: boolean
  recording: boolean
  transcribing: boolean
  activeAudioId?: string
  isPlaying: boolean
  onSend: (message: string) => Promise<void>
  onRecord: () => Promise<void>
  onPlay: (entry: TranscriptItem) => void
  onToggleActive: () => void
}

export function MeetingCenter(props: MeetingCenterProps) {
  const [message, setMessage] = useState('')
  const feedRef = useRef<HTMLDivElement>(null)
  const active = props.transcript.find((entry) => entry.id === props.activeAudioId)
  const activeParticipant = props.participants.find((participant) => participant.id === active?.participant_id)

  useEffect(() => {
    const feed = feedRef.current
    if (feed && typeof feed.scrollTo === 'function') feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' })
  }, [props.transcript.length])

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!message.trim() || props.sending) return
    const content = message.trim()
    setMessage('')
    try { await props.onSend(content) } catch { setMessage(content) }
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <main className="meeting" id="meeting">
      <header className="meeting-heading">
        <div><h1>{props.meeting?.title ?? 'Joint operating review'}</h1><p>{props.meeting?.agenda ?? 'Priority order, blockers, authority'}</p></div>
        <div className="meeting-meta"><UsersRound size={19} /><span>{props.selectedCount} selected</span><MoreHorizontal size={21} /></div>
      </header>

      {active && <section className="current-speaker" aria-label="Current speaker">
        <span className="avatar large">{activeParticipant?.initials ?? active.speaker.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
        <div><span className="speaker-name">{active.speaker}</span><span className="speaker-role">{activeParticipant?.role ?? 'Council participant'}</span></div>
        <span className="voice-label">VOICE: {activeParticipant?.voice_label ?? 'assigned'}</span>
        <span className="voice-wave" aria-label="Audio playing" />
        <button className="audio-control prominent" onClick={props.onToggleActive} aria-label={props.isPlaying ? 'Pause current speaker' : 'Resume current speaker'}>{props.isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}</button>
      </section>}

      <div className="transcript" ref={feedRef} aria-live="polite" aria-label="Meeting transcript">
        {!props.transcript.length && <div className="meeting-empty"><UsersRound size={34} /><h2>The council is ready</h2><p>Select participants, create the meeting, then ask a bounded question.</p></div>}
        {props.transcript.map((entry) => {
          const participant = props.participants.find((item) => item.id === entry.participant_id)
          return <article className={`transcript-entry ${entry.kind}`} key={entry.id}>
            <time dateTime={entry.created_at}>{formatTime(entry.created_at)}</time>
            <span className="timeline-node" aria-hidden="true" />
            <div className="entry-content">
              <div className="entry-topline"><h3>{entry.speaker}</h3>{entry.audio_url && <button className={`audio-control ${props.activeAudioId === entry.id ? 'active' : ''}`} onClick={() => props.onPlay(entry)} aria-label={`${props.activeAudioId === entry.id && props.isPlaying ? 'Pause' : 'Play'} ${entry.speaker}'s response`}>{props.activeAudioId === entry.id && props.isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>}</div>
              {participant && <span className="entry-role">{participant.role}</span>}
              <p>{entry.text}</p>
            </div>
          </article>
        })}
        {props.sending && <div className="responding"><LoaderCircle size={17} className="spin" /> The council is responding…</div>}
      </div>

      <form className="composer" onSubmit={submit}>
        <button type="button" className={`record-button ${props.recording ? 'recording' : ''}`} onClick={() => void props.onRecord()} aria-label={props.recording ? 'Stop recording' : 'Record message'} disabled={props.transcribing}>
          {props.transcribing ? <LoaderCircle className="spin" /> : props.recording ? <Square size={20} fill="currentColor" /> : <Mic />}
        </button>
        <label className="message-field"><span className="sr-only">Ask the council</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={keyDown} placeholder={props.transcribing ? 'Transcribing recording…' : 'Ask the council…'} rows={1} disabled={props.sending || props.transcribing} /><small>Enter to send · Shift+Enter for new line</small></label>
        <button className="send-button" disabled={!message.trim() || props.sending}><Send size={20} /> <span>Send</span></button>
      </form>
    </main>
  )
}

function formatTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}
