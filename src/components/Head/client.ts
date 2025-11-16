/**
 * Head Theme Setup
 * Runs early in <head> to avoid flash of un-themed styling (FOUS)
 * Sets up theme on document element and initializes metaColors global
 */

/**
 * HeadThemeSetup - Initializes theme colors for meta theme-color element
 */
class HeadThemeSetup {
  static scriptName = 'HeadThemeSetup'

  /**
   * Initialize meta colors global variable
   * Used to update the <meta name="theme-color" content="VALID_COLOR"> element
   * when the theme is changed. This tag sets the color for browser UI like title bars.
   */
  private static initializeMetaColors(): void {
    const themes = [
      { id: 'default', colors: { backgroundOffset: '#e2e2e2' } },
      { id: 'dark', colors: { backgroundOffset: '#00386d' } },
    ]

    // Initialize metaColors on window if it doesn't exist
    if (typeof window !== 'undefined') {
      window.metaColors = window.metaColors || {}
      themes.forEach(theme => {
        window.metaColors![theme.id] = theme.colors.backgroundOffset
      })
    }
  }

  static init(): void {
    HeadThemeSetup.initializeMetaColors()
  }

  static pause(): void {
    // No pause functionality needed for HeadThemeSetup
  }

  static resume(): void {
    // No resume functionality needed for HeadThemeSetup
  }

  static reset(): void {
    // No reset functionality needed for HeadThemeSetup
  }
}

export { HeadThemeSetup }
