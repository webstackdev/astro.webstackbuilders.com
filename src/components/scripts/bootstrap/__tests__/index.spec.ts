// @vitest-environment happy-dom
/**
 * Unit tests for AppBootstrap
 * Tests initialization of state management on page load
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppBootstrap } from '@components/scripts/bootstrap'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { TestError } from '@test/errors'

// Mock the store initialization functions
vi.mock('@components/scripts/store', () => ({
  initConsentFromCookies: vi.fn(),
  initConsentSideEffects: vi.fn(),
  addViewTransitionThemeInitListener: vi.fn(),
  $hasFunctionalConsent: {
    subscribe: vi.fn(),
  },
}))

// Mock Sentry breadcrumb function
vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: vi.fn(),
  handleScriptError: vi.fn(),
}))

// Import the mocked functions after setting up mocks
import {
  initConsentFromCookies,
  initConsentSideEffects,
  addViewTransitionThemeInitListener,
} from '@components/scripts/store'

describe('AppBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful initialization', () => {
    it('should call addViewTransitionThemeInitListener, initConsentFromCookies and initialize side effects', () => {
      vi.mocked(addViewTransitionThemeInitListener).mockReturnValue(undefined)
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()

      expect(addViewTransitionThemeInitListener).toHaveBeenCalledTimes(1)
      expect(initConsentFromCookies).toHaveBeenCalledTimes(1)
      expect(initConsentSideEffects).toHaveBeenCalledTimes(1)
    })

    it('should add breadcrumbs for successful initialization', () => {
      vi.mocked(addViewTransitionThemeInitListener).mockReturnValue(undefined)
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()

      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'init'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'addViewTransitionThemeInitListener'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initConsentFromCookies'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initConsentSideEffects'
      })
    })

    it('should not throw error when initialization succeeds', () => {
      vi.mocked(addViewTransitionThemeInitListener).mockReturnValue(undefined)
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)

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
      vi.mocked(addViewTransitionThemeInitListener).mockReturnValue(undefined)
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
        operation: 'addViewTransitionThemeInitListener'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initConsentFromCookies'
      })
    })

    it('should not call side effects when initConsentFromCookies fails', () => {
      vi.mocked(addViewTransitionThemeInitListener).mockReturnValue(undefined)
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw new TestError('Cookie initialization failed')
      })
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)

      try {
        AppBootstrap.init()
      } catch {
        // Expected to throw
      }

      expect(initConsentSideEffects).not.toHaveBeenCalled()
    })

    it('should wrap non-Error objects in ClientScriptError', () => {
      vi.mocked(addViewTransitionThemeInitListener).mockReturnValue(undefined)
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
      vi.mocked(addViewTransitionThemeInitListener).mockReturnValue(undefined)
      vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
      vi.mocked(initConsentSideEffects).mockReturnValue(undefined)

      AppBootstrap.init()
      AppBootstrap.init()

      expect(addViewTransitionThemeInitListener).toHaveBeenCalledTimes(2)
      expect(initConsentFromCookies).toHaveBeenCalledTimes(2)
      expect(initConsentSideEffects).toHaveBeenCalledTimes(2)
    })
  })
})