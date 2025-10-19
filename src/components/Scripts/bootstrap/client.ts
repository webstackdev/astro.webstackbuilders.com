/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { LoadableScript, type TriggerEvent } from '../loader/@types/loader'
import { initConsentFromCookies, initStateSideEffects } from '@lib/state'

export class AppBootstrap extends LoadableScript {
  static override scriptName = 'AppBootstrap'
  static override eventType: TriggerEvent = 'astro:before-preparation'

  static override init(): void {
    // 1. Load consent from cookies into store
    initConsentFromCookies()

    // 2. Setup side effects (runs once per page load)
    initStateSideEffects()

    console.log('✅ App state initialized')
  }

  static override pause(): void {
    // No pause functionality needed
  }

  static override resume(): void {
    // No resume functionality needed
  }
}
