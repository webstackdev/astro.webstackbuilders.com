/**
 * Global Window interface extensions
 * Centralizes all custom properties added to the window object
 */
import type { registerSW } from 'virtual:pwa-register'
import type { EvaluationError } from '@test/errors/EvaluationError'

/**
 * Meta colors object for theme color management
 * Maps theme IDs to their respective background offset colors
 * Used by ThemePicker and theme initialization scripts
 */
interface MetaColors {
  [key: string]: string
}

interface EnvironmentClientSnapshot {
  isUnitTest: boolean
  isTest: boolean
  isE2eTest: boolean
  isDev: boolean
  isProd: boolean
  packageRelease: string
  privacyPolicyVersion: string
}

interface EnvironmentApiSnapshot {
  isUnitTest: boolean
  isTest: boolean
  isE2eTest: boolean
  isDev: boolean
  isProd: boolean
  packageRelease: string
  privacyPolicyVersion: string
}

interface SiteUrlSnapshot {
  siteUrl: string
}

interface EnvironmentClientValues {
  packageRelease: string
  privacyPolicyVersion: string
}

declare global {
  interface Window {
    /**
     * Meta theme colors for browser UI theming
     * Initialized by HeadThemeSetup in <head>
     * Used to update <meta name="theme-color"> element
     */
    metaColors?: MetaColors

    /**
     * Test flag to indicate Playwright control
     */
    isPlaywrightControlled?: boolean

    /**
     * Snapshot of environment-client results for Playwright assertions
     */
    environmentClientSnapshot?: EnvironmentClientSnapshot

    /**
     * Snapshot of environment-api (server helper) results for Playwright assertions
     */
    environmentApiSnapshot?: EnvironmentApiSnapshot

    /**
     * Snapshot of client-side site URL helper
     */
    siteUrlClientSnapshot?: SiteUrlSnapshot

    /**
     * Snapshot of server-side site URL helper
     */
    siteUrlApiSnapshot?: SiteUrlSnapshot

    /**
     * Exposed store helpers that tests use to seed state when Playwright controls the browser.
     * These are only defined when window.isPlaywrightControlled === true.
     */
    updateConsent?: (_category: 'analytics' | 'marketing' | 'functional', _value: boolean) => void
    cacheEmbed?: (_key: string, _data: unknown, _ttl: number) => void
    saveMastodonInstance?: (_domain: string) => void
    setOverlayPauseState?: (_source: string, _isPaused: boolean) => void

    /**
     * Custom evaluation error injected during Playwright tests
     */
    EvaluationError?: typeof EvaluationError

    /**
     * Tracks astro:page-load events for view transition testing
     */
    __astroPageLoadCounter?: number
    __astroPageLoadListenerAttached?: boolean

    /**
     * Indicates whether the window is running inside a web worker context
     */
    __pwaUpdateSW?: ReturnType<typeof registerSW> | null

    /**
     * Exposes client environment helper values for diagnostics fixtures.
     */
    environmentClientValues?: EnvironmentClientValues
  }
}

export {}
