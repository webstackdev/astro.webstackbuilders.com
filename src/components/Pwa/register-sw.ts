import { registerSW } from 'virtual:pwa-register'

const registerServiceWorker = () => {
  const hasServiceWorker = 'serviceWorker' in navigator
  console.info('[pwa] register-sw start', { hasServiceWorker })

  if (!hasServiceWorker) {
    return
  }

  const updateSW = registerSW({
    immediate: false,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('pwa:need-refresh'))
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('pwa:offline-ready'))
    },
    onRegistered(registration) {
      console.info('[pwa] service worker registered', {
        scope: registration?.scope,
        installing: Boolean(registration?.installing),
        waiting: Boolean(registration?.waiting),
        active: Boolean(registration?.active),
      })
    },
    onRegisterError(error) {
      console.error('[pwa] service worker registration error', error)
    },
  })

  console.info('[pwa] register-sw hooked update handler')

  window.__pwaUpdateSW = updateSW

}

registerServiceWorker()
