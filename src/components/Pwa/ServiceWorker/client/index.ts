import { registerSW } from 'virtual:pwa-register'
import { isDev, isE2eTest } from '@components/scripts/utils/environmentClient'

export const registerServiceWorker = () => {
  const hasServiceWorker = 'serviceWorker' in navigator
  console.info('[pwa] register-sw start', { hasServiceWorker })
  const isPlaywrightRun = typeof window !== 'undefined' && window.isPlaywrightControlled === true
  if (isPlaywrightRun) {
    console.info('[pwa-test] registerServiceWorker invoked', {
      disableFlag: window.__disableServiceWorkerForE2E,
      devMode: isDev(),
      isE2eTest: isE2eTest(),
    })
  }

  if (!hasServiceWorker) {
    return
  }

  const disableForE2E =
    typeof window !== 'undefined' && window.__disableServiceWorkerForE2E === true
  if (disableForE2E) {
    console.info('[pwa] skipping service worker registration for e2e tests')
    if (isPlaywrightRun) {
      console.info('[pwa-test] disable flag still true, skipping registration')
    }
    void navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        console.info('[pwa] unregistering service worker (e2e disable)', {
          scope: registration.scope,
        })
        void registration.unregister()
      })
    })
    return
  }

  const allowDevServiceWorker = isDev() && isE2eTest()

  if (isDev() && !allowDevServiceWorker) {
    void navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        console.info('[pwa] unregistering dev service worker', { scope: registration.scope })
        void registration.unregister()
      })
    })
    return
  }

  if (allowDevServiceWorker) {
    console.info('[pwa] enabling dev service worker for E2E testing')
    if (isPlaywrightRun) {
      console.info('[pwa-test] allowDevServiceWorker true, proceeding with registration')
    }
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
  if (isPlaywrightRun) {
    console.info('[pwa-test] registerServiceWorker completed setup')
  }

  window.__pwaUpdateSW = updateSW
}
