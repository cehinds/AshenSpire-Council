import { Check, Circle, Search, ShieldCheck } from 'lucide-react'
import type { Lifecycle, Participant } from '../types'

interface RosterProps {
  participants: Participant[]
  selectedIds: string[]
  inspectedId?: string
  filter: Lifecycle
  search: string
  loading: boolean
  onFilter: (filter: Lifecycle) => void
  onSearch: (search: string) => void
  onSelect: (participant: Participant) => void
  onInspect: (participant: Participant) => void
}

export function Roster(props: RosterProps) {
  const filtered = props.participants.filter((participant) =>
    participant.lifecycle === props.filter && `${participant.name} ${participant.role} ${participant.team}`.toLowerCase().includes(props.search.toLowerCase()),
  )

  return (
    <aside className="roster panel" id="roster" aria-label="Council roster">
      <div className="panel-heading">
        <h2>Council roster</h2>
        <ShieldCheck size={17} aria-label="Verified role registry" />
      </div>
      <div className="filter-row" role="group" aria-label="Participant status">
        {(['active', 'supporting', 'legacy'] as const).map((value) => (
          <button key={value} className={props.filter === value ? 'filter active' : 'filter'} onClick={() => props.onFilter(value)}>
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      <label className="search-field">
        <Search size={18} />
        <span className="sr-only">Search participants</span>
        <input value={props.search} onChange={(event) => props.onSearch(event.target.value)} placeholder="Search participants…" />
      </label>

      <div className="participant-list" aria-live="polite">
        {props.loading && <p className="empty-state">Loading council roster…</p>}
        {!props.loading && !filtered.length && <p className="empty-state">No {props.filter} participants match this search.</p>}
        {filtered.map((participant) => {
          const selected = props.selectedIds.includes(participant.id)
          return (
            <div key={participant.id} className={`participant-row ${props.inspectedId === participant.id ? 'inspected' : ''}`}>
              <button className="participant-main" onClick={() => props.onInspect(participant)} aria-label={`Inspect ${participant.name}`}>
                <span className="avatar" aria-hidden="true">{participant.initials}</span>
                <span className="participant-copy">
                  <span className="participant-name">{participant.name}</span>
                  <span className="participant-role">{participant.role}</span>
                </span>
              </button>
              <button
                className={`selection ${selected ? 'selected' : ''}`}
                onClick={() => props.onSelect(participant)}
                aria-label={`${selected ? 'Remove' : 'Add'} ${participant.name} ${selected ? 'from' : 'to'} meeting`}
                aria-pressed={selected}
              >
                {selected ? <Check size={17} /> : <Circle size={22} />}
              </button>
            </div>
          )
        })}
      </div>
      <div className="simulation-note"><Circle size={19} /><span>AI role simulation —<br />not a human participant.</span></div>
    </aside>
  )
}
