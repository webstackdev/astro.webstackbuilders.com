/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { initConsentFromCookies, initStateSideEffects } from '@components/Scripts/state'

export class AppBootstrap {
  private static _cookieErrorMssg  = '❌ [12374] Failed to initialize consent from cookies:'
  private static _storageErrorMssg = '❌ [38088] Failed to initialize state side effects'
  private static _stateOkMssg = '✅ [36853] App state initialized'

  static init(): void {
    try {
      // 1. Load consent from cookies into store
      initConsentFromCookies()
    } catch (error: unknown) {
      if (!import.meta.env.PROD) {
        window.dispatchEvent(this._errorEvent(this._cookieErrorMssg, error as Error))
        console.error(this._cookieErrorMssg, error)
      }
      throw new Error(error instanceof Error ? error.message : String(error))
    }

    try {
      // 2. Setup side effects (runs once per page load)
      initStateSideEffects()
    } catch (error: unknown) {
      if (!import.meta.env.PROD) {
        window.dispatchEvent(this._errorEvent(this._storageErrorMssg, error as Error))
        console.error(this._storageErrorMssg, error)
      }
      throw new Error(error instanceof Error ? error.message : String(error))
    }

    if (!import.meta.env.PROD) {
      window.dispatchEvent(this._okEvent(this._stateOkMssg))
      console.info(this._stateOkMssg)
    }
  }

  private static _errorEvent(mssg: string, error: Error): CustomEvent {
    return new CustomEvent('appStateInitErrorEvent', {
      detail: {
        eventName: mssg,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      },
      cancelable: true,
    })
  }

  private static _okEvent(mssg: string): CustomEvent {
    return new CustomEvent('appStateInitOkEvent', {
      detail: {
        eventName: mssg,
      },
      cancelable: true,
    })
  }
}
