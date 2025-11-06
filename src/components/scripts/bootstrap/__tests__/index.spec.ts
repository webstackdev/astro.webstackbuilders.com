// @vitest-environment happy-dom
/**
 * Unit tests for AppBootstrap
 * Tests initialization of state management on page load
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppBootstrap } from '@components/scripts/bootstrap'
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { addScriptBreadcrumb } from '@components/scripts/errors'

// Mock the store initialization functions
vi.mock('@components/scripts/store', () => ({
  initConsentFromCookies: vi.fn(),
  $hasFunctionalConsent: {
    subscribe: vi.fn(),
  },
}))

// Mock store modules that are imported by bootstrap
vi.mock('@components/scripts/consent', () => ({
  initConsentSideEffects: vi.fn(),
  initStateSideEffects: vi.fn(),
}))

vi.mock('@components/scripts/theme', () => ({
  initThemeSideEffects: vi.fn(),
  setInitialTheme: vi.fn(),
}))

vi.mock('@components/scripts/store/socialEmbeds', () => ({
  clearEmbedCache: vi.fn(),
}))

// Mock Sentry breadcrumb function
vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: vi.fn(),
  handleScriptError: vi.fn(),
}))

// Import the mocked functions after setting up mocks
import { initConsentFromCookies } from '@components/scripts/store'
import { initConsentSideEffects, initStateSideEffects } from '@components/scripts/consent'
import { initThemeSideEffects } from '@components/scripts/theme'

describe('AppBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful initialization', () => {
    it('should call initConsentFromCookies and initialize side effects', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)
      vi.mocked(initThemeSideEffects).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()

      expect(initConsentFromCookies).toHaveBeenCalledTimes(1)
      expect(initConsentSideEffects).toHaveBeenCalledTimes(1)
      expect(initThemeSideEffects).toHaveBeenCalledTimes(1)
      expect(initStateSideEffects).toHaveBeenCalledTimes(1)
    })

    it('should add breadcrumbs for successful initialization', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)
      vi.mocked(initThemeSideEffects).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()

      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'init'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initConsentFromCookies'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initConsentSideEffects'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initThemeSideEffects'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initStateSideEffects'
      })
    })

    it('should not throw error when initialization succeeds', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)
      vi.mocked(initThemeSideEffects).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      expect(() => AppBootstrap.init()).not.toThrow()
    })
  })

  describe('Error handling - initConsentFromCookies fails', () => {
    it('should throw ClientScriptError when initConsentFromCookies throws', () => {
      const testError = new Error('Cookie initialization failed')
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw testError
      })

      expect(() => AppBootstrap.init()).toThrow(ClientScriptError)
      expect(() => AppBootstrap.init()).toThrow('Cookie initialization failed')
    })

    it('should add breadcrumb before throwing error', () => {
      const testError = new Error('Cookie initialization failed')
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw testError
      })

      try {
        AppBootstrap.init()
      } catch {
        // Expected to throw
      }

      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'init'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initConsentFromCookies'
      })
    })

    it('should not call side effects when initConsentFromCookies fails', () => {
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw new Error('Cookie initialization failed')
      })
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)
      vi.mocked(initThemeSideEffects).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      try {
        AppBootstrap.init()
      } catch {
        // Expected to throw
      }

      expect(initConsentSideEffects).not.toHaveBeenCalled()
      expect(initThemeSideEffects).not.toHaveBeenCalled()
      expect(initStateSideEffects).not.toHaveBeenCalled()
    })

    it('should wrap non-Error objects in ClientScriptError', () => {
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw 'String error'
      })

      expect(() => AppBootstrap.init()).toThrow(ClientScriptError)
      try {
        AppBootstrap.init()
      } catch (error) {
        expect(error).toBeInstanceOf(ClientScriptError)
        expect((error as ClientScriptError).message).toBe('String error')
      }
    })
  })

  describe('Integration scenarios', () => {
    it('should successfully initialize on repeated calls', () => {
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)
      vi.mocked(initThemeSideEffects).mockReturnValue(undefined)
      vi.mocked(initStateSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()
      AppBootstrap.init()

      expect(initConsentFromCookies).toHaveBeenCalledTimes(2)
      expect(initConsentSideEffects).toHaveBeenCalledTimes(2)
      expect(initThemeSideEffects).toHaveBeenCalledTimes(2)
      expect(initStateSideEffects).toHaveBeenCalledTimes(2)
    })
  })
})
