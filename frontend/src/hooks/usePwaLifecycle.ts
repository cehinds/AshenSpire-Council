import { useCallback, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean }

export type InstallState = 'unavailable' | 'manual' | 'installable' | 'installing' | 'installed' | 'ios' | 'dismissed'

export interface PwaLifecycle {
  installState: InstallState
  updateAvailable: boolean
  applyingUpdate: boolean
  install: () => Promise<void>
  applyUpdate: () => Promise<void>
}

interface UpdateReadyDetail {
  applyUpdate?: () => boolean | Promise<boolean>
}

type AshenSpirePwaWindow = Window & {
  ashenSpirePWA?: {
    updateAvailable?: boolean
    applyUpdate?: () => boolean | Promise<boolean>
  }
}

function isStandalone() {
  return Boolean(window.matchMedia?.('(display-mode: standalone)').matches)
    || Boolean((navigator as NavigatorWithStandalone).standalone)
}

function isIosDevice() {
  const hasIosPlatform = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return hasIosPlatform || isTouchMac
}

function initialInstallState(): InstallState {
  if (isStandalone()) return 'installed'
  if (isIosDevice()) return 'ios'
  return 'unavailable'
}

export function usePwaLifecycle(): PwaLifecycle {
  const [installState, setInstallState] = useState<InstallState>(initialInstallState)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [applyingUpdate, setApplyingUpdate] = useState(false)
  const installPrompt = useRef<BeforeInstallPromptEvent | undefined>(undefined)
  const updateAction = useRef<UpdateReadyDetail['applyUpdate'] | undefined>(undefined)

  useEffect(() => {
    const manualGuidanceTimer = window.setTimeout(() => {
      setInstallState((state) => state === 'unavailable' ? 'manual' : state)
    }, 1500)
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      window.clearTimeout(manualGuidanceTimer)
      installPrompt.current = event as BeforeInstallPromptEvent
      setInstallState('installable')
    }
    const handleInstalled = () => {
      window.clearTimeout(manualGuidanceTimer)
      installPrompt.current = undefined
      setInstallState('installed')
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.clearTimeout(manualGuidanceTimer)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  useEffect(() => {
    const pwaWindow = window as AshenSpirePwaWindow
    const handleUpdateReady = (event: Event) => {
      const detail = (event as CustomEvent<UpdateReadyDetail>).detail
      updateAction.current = detail?.applyUpdate ?? pwaWindow.ashenSpirePWA?.applyUpdate
      setUpdateAvailable(Boolean(updateAction.current))
    }

    if (pwaWindow.ashenSpirePWA?.updateAvailable) {
      updateAction.current = pwaWindow.ashenSpirePWA.applyUpdate
      setUpdateAvailable(Boolean(updateAction.current))
    }
    window.addEventListener('ashenspire:pwa-update-ready', handleUpdateReady)
    return () => window.removeEventListener('ashenspire:pwa-update-ready', handleUpdateReady)
  }, [])

  const install = useCallback(async () => {
    const prompt = installPrompt.current
    if (!prompt) return

    setInstallState('installing')
    try {
      await prompt.prompt()
      const choice = await prompt.userChoice
      installPrompt.current = undefined
      if (choice.outcome === 'dismissed') setInstallState('dismissed')
    } catch {
      installPrompt.current = undefined
      setInstallState('dismissed')
    }
  }, [])

  const applyUpdate = useCallback(async () => {
    const action = updateAction.current
    if (!action) return
    setApplyingUpdate(true)
    try {
      const applied = await action()
      if (applied) return
      setApplyingUpdate(false)
      setUpdateAvailable(false)
    } catch {
      setApplyingUpdate(false)
    }
  }, [])

  return { installState, updateAvailable, applyingUpdate, install, applyUpdate }
}
