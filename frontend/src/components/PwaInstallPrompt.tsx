import { CheckCircle2, Download, LoaderCircle, RefreshCw, Share2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePwaLifecycle } from '../hooks/usePwaLifecycle'

export function PwaInstallPrompt() {
  const lifecycle = usePwaLifecycle()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (lifecycle.updateAvailable) setDismissed(false)
  }, [lifecycle.updateAvailable])

  if (dismissed || lifecycle.installState === 'unavailable' || lifecycle.installState === 'dismissed') return null

  const close = <button className="pwa-notice-close" type="button" onClick={() => setDismissed(true)} aria-label="Dismiss app notice"><X size={17} /></button>

  if (lifecycle.updateAvailable) {
    return <aside className="pwa-notice" aria-label="App update available">
      <RefreshCw size={21} aria-hidden="true" className={lifecycle.applyingUpdate ? 'spin' : undefined} />
      <div><strong>{lifecycle.applyingUpdate ? 'Updating…' : 'Update available'}</strong><span>{lifecycle.applyingUpdate ? 'The council will reopen when ready.' : 'Refresh to use the latest council build.'}</span></div>
      {!lifecycle.applyingUpdate && <button className="pwa-notice-action" type="button" onClick={() => void lifecycle.applyUpdate()}>Update now</button>}
      {close}
    </aside>
  }

  if (lifecycle.installState === 'ios') {
    return <aside className="pwa-notice" aria-label="Install app guidance">
      <Share2 size={21} aria-hidden="true" />
      <div><strong>Install AshenSpire Council</strong><span>Tap Share, then Add to Home Screen.</span></div>
      {close}
    </aside>
  }

  if (lifecycle.installState === 'manual') {
    return <aside className="pwa-notice" aria-label="Install app guidance">
      <Download size={21} aria-hidden="true" />
      <div><strong>Install from your browser</strong><span>Open the browser menu and choose Install app or Add to Home Screen.</span></div>
      {close}
    </aside>
  }

  if (lifecycle.installState === 'installing') {
    return <aside className="pwa-notice" role="status" aria-live="polite">
      <LoaderCircle size={21} className="spin" aria-hidden="true" />
      <div><strong>Installing…</strong><span>Finish the browser prompt to add the council.</span></div>
      {close}
    </aside>
  }

  if (lifecycle.installState === 'installed') {
    return <aside className="pwa-notice" role="status" aria-live="polite">
      <CheckCircle2 size={21} aria-hidden="true" />
      <div><strong>App installed</strong><span>AshenSpire Council can now open from your device.</span></div>
      {close}
    </aside>
  }

  return <aside className="pwa-notice" aria-label="Install AshenSpire Council">
    <Download size={21} aria-hidden="true" />
    <div><strong>Use AshenSpire Council as an app</strong><span>Install it for quick access and a dedicated window.</span></div>
    <button className="pwa-notice-action" type="button" onClick={() => void lifecycle.install()}>Install</button>
    {close}
  </aside>
}
