/**
 * Global Window interface extensions
 * Centralizes all custom properties added to the window object
 */

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
  }
}

export {}
