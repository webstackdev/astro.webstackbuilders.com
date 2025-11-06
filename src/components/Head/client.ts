/**
 * Head Theme Setup - LoadableScript Implementation
 * Runs early in <head> to avoid flash of un-themed styling (FOUS)
 * Sets up theme on document element and initializes metaColors global
 */

import { LoadableScript, type TriggerEvent } from '@components/scripts/loader/@types'

/**
 * HeadThemeSetup component using LoadableScript pattern
 * Initializes theme colors for meta theme-color element
 */
class HeadThemeSetup extends LoadableScript {
  static override scriptName = 'HeadThemeSetup'
  static override eventType: TriggerEvent = 'astro:page-load'

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).metaColors = (window as any).metaColors || {}
      themes.forEach(theme => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).metaColors[theme.id] = theme.colors.backgroundOffset
      })
    }
  }

  static override init(): void {
    HeadThemeSetup.initializeMetaColors()
  }

  static override pause(): void {
    // No pause functionality needed for HeadThemeSetup
  }

  static override resume(): void {
    // No resume functionality needed for HeadThemeSetup
  }

  static override reset(): void {
    // No reset functionality needed for HeadThemeSetup
  }
}

export { HeadThemeSetup }
