import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Roster } from './Roster'
import { participants } from '../test/fixtures'

describe('Roster', () => {
  it('selects and removes a participant from the meeting', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<Roster participants={participants} selectedIds={[]} inspectedId={participants[0].id} filter="active" search="" loading={false} onFilter={vi.fn()} onSearch={vi.fn()} onSelect={onSelect} onInspect={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Add Mara Voss to meeting' }))
    expect(onSelect).toHaveBeenCalledWith(participants[0])

    rerender(<Roster participants={participants} selectedIds={[participants[0].id]} inspectedId={participants[0].id} filter="active" search="" loading={false} onFilter={vi.fn()} onSearch={vi.fn()} onSelect={onSelect} onInspect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Remove Mara Voss from meeting' })).toHaveAttribute('aria-pressed', 'true')
  })
})
