// @vitest-environment happy-dom
/**
 * Unit tests for AppBootstrap
 * Tests initialization of state management on page load
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AppBootstrap } from '../bootstrap'
import { ClientScriptError } from '@components/Scripts/errors/ClientScriptError'

// Mock the state initialization functions
vi.mock('@components/Scripts/state', () => ({
  initConsentFromCookies: vi.fn(),
  initStateSideEffects: vi.fn(),
}))

// Mock Sentry breadcrumb function
vi.mock('@components/Scripts/errors', () => ({
  addScriptBreadcrumb: vi.fn(),
}))

import { initConsentFromCookies, initStateSideEffects } from '@components/Scripts/state'
import { addScriptBreadcrumb } from '@components/Scripts/errors'

describe('AppBootstrap', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleInfoSpy: any
  let eventListenerSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Clear window globals
    window._isBootstrapped = false
    if ('_bootstrapError' in window) {
      delete (window as {_bootstrapError?: unknown})._bootstrapError
    }

    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    // Setup event listener spy
    eventListenerSpy = vi.fn()
    window.addEventListener('appStateInitErrorEvent', eventListenerSpy)
    window.addEventListener('appStateInitOkEvent', eventListenerSpy)
  })

  afterEach(() => {
    // Restore all spies
    consoleErrorSpy.mockRestore()
    consoleInfoSpy.mockRestore()

    // Remove event listeners
    window.removeEventListener('appStateInitErrorEvent', eventListenerSpy)
    window.removeEventListener('appStateInitOkEvent', eventListenerSpy)
  })

  describe('Successful initialization', () => {
    it('should call initConsentFromCookies and initStateSideEffects in order', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()

      expect(initConsentFromCookies).toHaveBeenCalledTimes(1)
      expect(initStateSideEffects).toHaveBeenCalledTimes(1)

      // Verify order of calls
      const callOrder = vi.mocked(initConsentFromCookies).mock.invocationCallOrder[0]
      const sideEffectsOrder = vi.mocked(initStateSideEffects).mock.invocationCallOrder[0]
      expect(callOrder).toBeDefined()
      expect(sideEffectsOrder).toBeDefined()
      expect(callOrder!).toBeLessThan(sideEffectsOrder!)
    })

    it.skip('should dispatch success event in non-production environment', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()

      // Check if success event was dispatched
      expect(eventListenerSpy).toHaveBeenCalled()
      const successEvent = eventListenerSpy.mock.calls.find(
        (call) => call[0].type === 'appStateInitOkEvent'
      )
      expect(successEvent).toBeDefined()
      expect(successEvent?.[0].detail.eventName).toContain('✅')
      expect(successEvent?.[0].detail.eventName).toContain('App state initialized')
    })

    it('should log success message in non-production environment', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅')
      )
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('App state initialized')
      )
    })

    it('should not throw error when both functions succeed', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      expect(() => AppBootstrap.init()).not.toThrow()
    })
  })

  describe('Error handling - initConsentFromCookies fails', () => {
    it('should not throw in DEV when initConsentFromCookies throws', () => {
      const testError = new Error('Cookie initialization failed')
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw testError
      })

      expect(() => AppBootstrap.init()).not.toThrow()
      expect(window._isBootstrapped).toBe(true)
      expect(window._bootstrapError).toBeDefined()
      expect(window._bootstrapError?.message).toBe('Cookie initialization failed')
    })

    it.skip('should dispatch error event when initConsentFromCookies fails', () => {
      const testError = new Error('Cookie initialization failed')
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw testError
      })

      try {
        AppBootstrap.init()
      } catch {
        // Expected to throw
      }

      const errorEvent = eventListenerSpy.mock.calls.find(
        (call) => call[0].type === 'appStateInitErrorEvent'
      )
      expect(errorEvent).toBeDefined()
      expect(errorEvent?.[0].detail.eventName).toContain('Failed to initialize consent from cookies')
      expect(errorEvent?.[0].detail.errorName).toBe('Error')
      expect(errorEvent?.[0].detail.errorMessage).toBe('Cookie initialization failed')
    })

    it('should log error when initConsentFromCookies fails', () => {
      const testError = new Error('Cookie initialization failed')
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw testError
      })

      AppBootstrap.init()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [12374] Failed to initialize consent from cookies:',
        expect.any(Object)
      )
    })

    it('should still call initStateSideEffects when initConsentFromCookies fails in DEV', () => {
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw new Error('Cookie initialization failed')
      })
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()

      // In DEV mode, execution continues even after first error
      expect(initStateSideEffects).toHaveBeenCalled()
    })

    it('should handle non-Error objects thrown by initConsentFromCookies', () => {
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw 'String error'
      })

      expect(() => AppBootstrap.init()).not.toThrow()
      expect(window._bootstrapError?.message).toBe('String error')
    })

    it('should handle objects thrown by initConsentFromCookies', () => {
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw { message: 'Object error' }
      })

      expect(() => AppBootstrap.init()).not.toThrow()
      expect(window._bootstrapError?.message).toBe('[object Object]')
    })
  })

  describe('Error handling - initStateSideEffects fails', () => {
    it('should not throw in DEV when initStateSideEffects throws', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      const testError = new Error('State side effects failed')
      vi.mocked(initStateSideEffects).mockImplementation(() => {
        throw testError
      })

      expect(() => AppBootstrap.init()).not.toThrow()
      expect(window._isBootstrapped).toBe(true)
      expect(window._bootstrapError).toBeDefined()
      expect(window._bootstrapError?.message).toBe('State side effects failed')
    })

    it.skip('should dispatch error event when initStateSideEffects fails', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      const testError = new Error('State side effects failed')
      vi.mocked(initStateSideEffects).mockImplementation(() => {
        throw testError
      })

      try {
        AppBootstrap.init()
      } catch {
        // Expected to throw
      }

      const errorEvent = eventListenerSpy.mock.calls.find(
        (call) => call[0].type === 'appStateInitErrorEvent'
      )
      expect(errorEvent).toBeDefined()
      expect(errorEvent?.[0].detail.eventName).toContain('Failed to initialize state side effects')
      expect(errorEvent?.[0].detail.errorName).toBe('Error')
      expect(errorEvent?.[0].detail.errorMessage).toBe('State side effects failed')
    })

    it('should log error when initStateSideEffects fails', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      const testError = new Error('State side effects failed')
      vi.mocked(initStateSideEffects).mockImplementation(() => {
        throw testError
      })

      AppBootstrap.init()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [38088] Failed to initialize state side effects',
        expect.any(Object)
      )
    })

    it('should have called initConsentFromCookies before initStateSideEffects fails', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockImplementation(() => {
        throw new Error('State side effects failed')
      })

      AppBootstrap.init()

      expect(initConsentFromCookies).toHaveBeenCalledTimes(1)
    })

    it('should not log success when initStateSideEffects fails', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockImplementation(() => {
        throw new Error('State side effects failed')
      })

      AppBootstrap.init()

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should handle non-Error objects thrown by initStateSideEffects', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockImplementation(() => {
        throw 'String error'
      })

      expect(() => AppBootstrap.init()).not.toThrow()
      expect(window._bootstrapError?.message).toBe('String error')
    })
  })

  describe('Event details', () => {
    it.skip('should include error stack trace in error event', () => {
      const testError = new Error('Test error with stack')
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw testError
      })

      try {
        AppBootstrap.init()
      } catch {
        // Expected to throw
      }

      const errorEvent = eventListenerSpy.mock.calls.find(
        (call) => call[0].type === 'appStateInitErrorEvent'
      )
      expect(errorEvent?.[0].detail.stack).toBeDefined()
    })

    it.skip('should mark error events as cancelable', () => {
      const testError = new Error('Test error')
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw testError
      })

      try {
        AppBootstrap.init()
      } catch {
        // Expected to throw
      }

      const errorEvent = eventListenerSpy.mock.calls.find(
        (call) => call[0].type === 'appStateInitErrorEvent'
      )
      expect(errorEvent?.[0].cancelable).toBe(true)
    })

    it.skip('should mark success events as cancelable', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()

      const successEvent = eventListenerSpy.mock.calls.find(
        (call) => call[0].type === 'appStateInitOkEvent'
      )
      expect(successEvent?.[0].cancelable).toBe(true)
    })
  })

  describe('Integration scenarios', () => {
    it('should successfully initialize on repeated calls', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()
      AppBootstrap.init()

      expect(initConsentFromCookies).toHaveBeenCalledTimes(2)
      expect(initStateSideEffects).toHaveBeenCalledTimes(2)
    })

    it('should handle alternating success and failure', () => {
      // First call succeeds
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()
      expect(initConsentFromCookies).toHaveBeenCalledTimes(1)

      // Second call fails
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw new Error('Second call failed')
      })

      // In DEV mode, doesn't throw
      expect(() => AppBootstrap.init()).not.toThrow()
      expect(initConsentFromCookies).toHaveBeenCalledTimes(2)
      expect(window._bootstrapError?.message).toBe('Second call failed')
    })
  })
})
