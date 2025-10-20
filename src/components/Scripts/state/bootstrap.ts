/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { initConsentFromCookies, initStateSideEffects } from '@components/Scripts/state'

export class AppBootstrap {
  static init(): void {
    let hasErrors = false

    try {
      // 1. Load consent from cookies into store
      initConsentFromCookies()
    } catch (error) {
      console.error('❌ Failed to initialize consent from cookies:', error)
      hasErrors = true
    }

    try {
      // 2. Setup side effects (runs once per page load)
      initStateSideEffects()
    } catch (error) {
      console.error('❌ Failed to initialize state side effects:', error)
      hasErrors = true
    }

    if (hasErrors) {
      console.error('❌ App state initialized with errors')
    } else {
      console.log('✅ App state initialized')
    }
  }
}
