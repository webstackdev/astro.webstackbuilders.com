import { registerSW } from 'virtual:pwa-register'
import { isDev, isE2eTest } from '@components/scripts/utils/environmentClient'

export const registerServiceWorker = () => {
  const hasServiceWorker = 'serviceWorker' in navigator
  console.info('[pwa] register-sw start', { hasServiceWorker })

  if (!hasServiceWorker) {
    return
  }

  const devMode = isDev()
  const allowDevServiceWorker = devMode && isE2eTest()

  if (devMode && !allowDevServiceWorker) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        console.info('[pwa] unregistering dev service worker', { scope: registration.scope })
        void registration.unregister()
      })
    })
    return
  }

  if (allowDevServiceWorker) {
    console.info('[pwa] enabling dev service worker for E2E testing')
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
