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

declare global {
  interface Window {
    /**
     * Meta theme colors for browser UI theming
     * Initialized by HeadThemeSetup in <head>
     * Used to update <meta name="theme-color"> element
     */
    metaColors?: MetaColors

    /**
     * Test flag to force error throwing in development
     * Used by error handler to re-throw errors for debugging
     * Set by E2E tests via page.evaluate()
     */
    _throw?: boolean
  }
}

export {}
