import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MeetingCenter } from './MeetingCenter'
import { participants } from '../test/fixtures'

describe('MeetingCenter', () => {
  it('renders an attributed transcript with participant role and audio control', () => {
    render(<MeetingCenter
      meeting={{ id: 'meeting-1', title: 'Joint operating review', agenda: 'Priority order, blockers, authority', participant_ids: participants.map((item) => item.id) }}
      participants={participants}
      selectedCount={2}
      transcript={[{ id: 'entry-1', speaker: 'Mara Voss', participant_id: participants[0].id, text: 'The integration lane is gated on currentness.', created_at: '2026-08-27T09:02:00Z', audio_url: '/audio/entry-1.mp3', kind: 'agent' }]}
      sending={false}
      recording={false}
      transcribing={false}
      isPlaying={false}
      onSend={vi.fn()}
      onRecord={vi.fn()}
      onPlay={vi.fn()}
      onToggleActive={vi.fn()}
    />)

    expect(screen.getByRole('heading', { name: 'Mara Voss' })).toBeInTheDocument()
    expect(screen.getByText('IT Manager III')).toBeInTheDocument()
    expect(screen.getByText('The integration lane is gated on currentness.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "Play Mara Voss's response" })).toBeInTheDocument()
  })
})
