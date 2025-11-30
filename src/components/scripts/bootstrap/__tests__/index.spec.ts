// @vitest-environment jsdom
/**
 * Unit tests for AppBootstrap
 * Tests initialization of state management on page load
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppBootstrap } from '@components/scripts/bootstrap'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { TestError } from '@test/errors'

vi.mock('@components/scripts/errors', async () => {
  const actual = await vi.importActual<typeof import('@components/scripts/errors')>(
    '@components/scripts/errors'
  )

  return {
    ...actual,
    addScriptBreadcrumb: vi.fn(),
    handleScriptError: vi.fn(),
  }
})

// Mock the store initialization functions
vi.mock('@components/scripts/store', () => ({
  initConsentFromCookies: vi.fn(),
  initConsentSideEffects: vi.fn(),
  initAnimationLifecycle: vi.fn(),
  exposeStoreActionsForTesting: vi.fn(),
  $hasFunctionalConsent: {
    subscribe: vi.fn(),
  },
}))

vi.mock('@components/scripts/sentry/client', () => ({
  SentryBootstrap: {
    init: vi.fn(),
  },
}))

const mockEnvironmentClient = vi.hoisted(() => ({
  getPackageRelease: vi.fn().mockReturnValue('test-release'),
  getPrivacyPolicyVersion: vi.fn().mockReturnValue('1.0.0'),
  isProd: vi.fn().mockReturnValue(false),
  isDev: vi.fn().mockReturnValue(true),
  isE2eTest: vi.fn().mockReturnValue(false),
  isTest: vi.fn().mockReturnValue(false),
  isUnitTest: vi.fn().mockReturnValue(true),
}))

vi.mock('@components/scripts/utils/environmentClient', () => mockEnvironmentClient)

// Import the mocked functions after setting up mocks
import {
  initConsentFromCookies,
  initConsentSideEffects,
  initAnimationLifecycle,
  exposeStoreActionsForTesting,
} from '@components/scripts/store'
import { SentryBootstrap } from '@components/scripts/sentry/client'

type TestWindow = Window & {
  isPlaywrightControlled?: boolean
  environmentClientSnapshot?: {
    isUnitTest: boolean
    isTest: boolean
    isE2eTest: boolean
    isDev: boolean
    isProd: boolean
    packageRelease: string
    privacyPolicyVersion: string
  }
}

const testWindow = window as TestWindow
const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

const mockSuccessfulInit = () => {
  vi.mocked(initConsentFromCookies).mockReturnValue(undefined)
  vi.mocked(initConsentSideEffects).mockReturnValue(undefined)
  vi.mocked(initAnimationLifecycle).mockReturnValue(undefined)
  vi.mocked(exposeStoreActionsForTesting).mockReturnValue(undefined)
}

describe('AppBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccessfulInit()
    delete testWindow.isPlaywrightControlled
    delete testWindow.environmentClientSnapshot
    mockEnvironmentClient.isProd.mockReturnValue(false)
    mockEnvironmentClient.isDev.mockReturnValue(true)
    mockEnvironmentClient.isE2eTest.mockReturnValue(false)
    mockEnvironmentClient.isTest.mockReturnValue(false)
    mockEnvironmentClient.isUnitTest.mockReturnValue(true)
    mockEnvironmentClient.getPackageRelease.mockReturnValue('test-release')
    mockEnvironmentClient.getPrivacyPolicyVersion.mockReturnValue('1.0.0')
    consoleInfoSpy.mockClear()
  })

  afterAll(() => {
    consoleInfoSpy.mockRestore()
  })

  describe('Successful initialization', () => {
    it('should add breadcrumbs for successful initialization', () => {
      AppBootstrap.init()

      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'init'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initAnimationLifecycle'
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
      expect(() => AppBootstrap.init()).not.toThrow()
    })
  })

  describe('Error handling - initConsentFromCookies fails', () => {
    it('should throw ClientScriptError when initConsentFromCookies throws', () => {
      const testError = new TestError('Cookie initialization failed')
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw testError
      })

      expect(() => AppBootstrap.init()).toThrow(ClientScriptError)
      expect(() => AppBootstrap.init()).toThrow('Cookie initialization failed')
    })

    it('should add breadcrumb before throwing error', () => {
      const testError = new TestError('Cookie initialization failed')
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
        operation: 'initAnimationLifecycle'
      })
      expect(addScriptBreadcrumb).toHaveBeenCalledWith({
        scriptName: 'AppBootstrap',
        operation: 'initConsentFromCookies'
      })
    })

    it('should not call side effects when initConsentFromCookies fails', () => {
      vi.mocked(initConsentFromCookies).mockImplementation(() => {
        throw new TestError('Cookie initialization failed')
      })

      try {
        AppBootstrap.init()
      } catch {
        // Expected to throw
      }

      expect(initConsentSideEffects).not.toHaveBeenCalled()
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
      AppBootstrap.init()
      AppBootstrap.init()

      expect(initAnimationLifecycle).toHaveBeenCalledTimes(2)
      expect(initConsentFromCookies).toHaveBeenCalledTimes(2)
      expect(initConsentSideEffects).toHaveBeenCalledTimes(2)
      expect(exposeStoreActionsForTesting).toHaveBeenCalledTimes(2)
    })
  })

  describe('Runtime integrations', () => {
    it('should write the environment snapshot when Playwright controls the window', () => {
      testWindow.isPlaywrightControlled = true
      mockEnvironmentClient.isUnitTest.mockReturnValue(false)
      mockEnvironmentClient.isTest.mockReturnValue(true)
      mockEnvironmentClient.isE2eTest.mockReturnValue(true)
      mockEnvironmentClient.isDev.mockReturnValue(false)
      mockEnvironmentClient.isProd.mockReturnValue(true)
      mockEnvironmentClient.getPackageRelease.mockReturnValue('2024.10.0')
      mockEnvironmentClient.getPrivacyPolicyVersion.mockReturnValue('3.1.4')

      AppBootstrap.init()

      expect(testWindow.environmentClientSnapshot).toEqual({
        isUnitTest: false,
        isTest: true,
        isE2eTest: true,
        isDev: false,
        isProd: true,
        packageRelease: '2024.10.0',
        privacyPolicyVersion: '3.1.4',
      })
    })

    it('should initialize Sentry in production builds', () => {
      mockEnvironmentClient.isProd.mockReturnValue(true)

      AppBootstrap.init()

      expect(SentryBootstrap.init).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should log when Sentry stays disabled outside production', () => {
      mockEnvironmentClient.isProd.mockReturnValue(false)

      AppBootstrap.init()

      expect(SentryBootstrap.init).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalledWith('🔧 Sentry disabled in development mode')
    })
  })
})