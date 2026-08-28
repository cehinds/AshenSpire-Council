import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PwaLifecycle } from '../hooks/usePwaLifecycle'
import { usePwaLifecycle } from '../hooks/usePwaLifecycle'
import { PwaInstallPrompt } from './PwaInstallPrompt'

vi.mock('../hooks/usePwaLifecycle', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/usePwaLifecycle')>()
  return { ...actual, usePwaLifecycle: vi.fn() }
})

const mockedLifecycle = vi.mocked(usePwaLifecycle)
const install = vi.fn<() => Promise<void>>()
const applyUpdate = vi.fn<() => Promise<void>>()

function setLifecycle(overrides: Partial<PwaLifecycle> = {}) {
  mockedLifecycle.mockReturnValue({
    installState: 'unavailable',
    updateAvailable: false,
    applyingUpdate: false,
    install,
    applyUpdate,
    ...overrides,
  })
}

describe('PwaInstallPrompt', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    setLifecycle()
  })

  it('offers a working install action when installation is supported', async () => {
    setLifecycle({ installState: 'installable' })
    render(<PwaInstallPrompt />)

    await userEvent.click(screen.getByRole('button', { name: 'Install' }))

    expect(screen.getByText('Use AshenSpire Council as an app')).toBeInTheDocument()
    expect(install).toHaveBeenCalledOnce()
  })

  it('announces installation progress without an inert install button', () => {
    setLifecycle({ installState: 'installing' })
    render(<PwaInstallPrompt />)

    expect(screen.getByRole('status')).toHaveTextContent('Installing…')
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
  })

  it('confirms the installed state and remains dismissible', async () => {
    setLifecycle({ installState: 'installed' })
    render(<PwaInstallPrompt />)

    expect(screen.getByRole('status')).toHaveTextContent('App installed')
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss app notice' }))
    expect(screen.queryByText('App installed')).not.toBeInTheDocument()
  })

  it('offers a working update action when a service worker is waiting', async () => {
    setLifecycle({ installState: 'installed', updateAvailable: true })
    render(<PwaInstallPrompt />)

    await userEvent.click(screen.getByRole('button', { name: 'Update now' }))

    expect(screen.getByText('Update available')).toBeInTheDocument()
    expect(applyUpdate).toHaveBeenCalledOnce()
  })

  it('shows truthful iOS installation guidance instead of a programmatic install action', () => {
    setLifecycle({ installState: 'ios' })
    render(<PwaInstallPrompt />)

    expect(screen.getByText('Tap Share, then Add to Home Screen.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
  })

  it('shows menu guidance when the browser does not expose a native install prompt', () => {
    setLifecycle({ installState: 'manual' })
    render(<PwaInstallPrompt />)

    expect(screen.getByText('Install from your browser')).toBeInTheDocument()
    expect(screen.getByText('Open the browser menu and choose Install app or Add to Home Screen.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
  })
})
