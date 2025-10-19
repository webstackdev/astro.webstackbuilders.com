/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { initConsentFromCookies, initStateSideEffects } from '@components/Scripts/state'

export class AppBootstrap {
  static init(): void {
    // 1. Load consent from cookies into store
    initConsentFromCookies()

    // 2. Setup side effects (runs once per page load)
    initStateSideEffects()

    console.log('✅ App state initialized')
  }
}
