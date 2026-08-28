import { describe, expect, it } from 'vitest'
import registry from '../../data/participants.json'
import { normalizeParticipant } from './api'

describe('GitHub Pages registry normalization', () => {
  it('normalizes every persisted role without losing stable identity or voice', () => {
    const participants = registry.participants.map(normalizeParticipant)

    expect(participants).toHaveLength(18)
    expect(participants.every((participant) => participant.id.startsWith('ashenspire.'))).toBe(true)
    expect(participants.every((participant) => participant.name !== 'Unnamed participant')).toBe(true)
    expect(participants.every((participant) => participant.voice_id !== 'alloy' || participant.voice_label !== 'alloy')).toBe(true)
    expect(new Set(participants.map((participant) => participant.canonical_task_id)).size).toBe(18)
  })
})
