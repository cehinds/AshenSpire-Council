const events = {
  ready: 'ashenspire:pwa-ready',
  offlineReady: 'ashenspire:pwa-offline-ready',
  updateReady: 'ashenspire:pwa-update-ready',
  error: 'ashenspire:pwa-error',
}

const emit = (name, detail = {}) => {
  window.dispatchEvent(new CustomEvent(events[name], { detail }))
}

const pwa = {
  registration: null,
  updateAvailable: false,
  async applyUpdate() {
    const waitingWorker = pwa.registration?.waiting
    if (!waitingWorker) return false

    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    return true
  },
}

window.ashenSpirePWA = pwa

const isLocalBackendHost = ['127.0.0.1', 'localhost', '[::1]'].includes(
  window.location.hostname,
)

if ('serviceWorker' in navigator && isLocalBackendHost) {
  const localScope = new URL('./', document.baseURI).pathname
  const localWorkerPath = new URL('sw.js', document.baseURI).pathname

  navigator.serviceWorker.getRegistration(localScope).then((registration) => {
    const workerUrl = registration?.active?.scriptURL
    if (workerUrl && new URL(workerUrl).pathname === localWorkerPath) {
      void registration.unregister()
    }
  })

  if ('caches' in window) {
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('ashenspire-council-v1-'))
        .map((key) => caches.delete(key)),
    ))
  }
}

if ('serviceWorker' in navigator && !isLocalBackendHost) {
  let reloading = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })

  window.addEventListener('load', async () => {
    try {
      const swUrl = new URL('sw.js', document.baseURI)
      const scopeUrl = new URL('./', document.baseURI)
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: scopeUrl.pathname,
      })

      pwa.registration = registration
      emit('ready', { registration })

      const announceUpdate = () => {
        pwa.updateAvailable = true
        emit('updateReady', {
          registration,
          applyUpdate: () => pwa.applyUpdate(),
        })
      }

      if (registration.waiting) announceUpdate()

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing
        if (!installingWorker) return

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state !== 'installed') return
          if (navigator.serviceWorker.controller) announceUpdate()
          else emit('offlineReady', { registration })
        })
      })
    } catch (error) {
      emit('error', { error })
    }
  })
}
