/**
 * Theme State Management
 */
import { persistentAtom } from '@nanostores/persistent'
import type { ThemeId } from './@types'
import { $consent } from './cookieConsent'
import { handleScriptError } from '@components/Scripts/errors'

// ============================================================================
// STORES
// ============================================================================

/**
 * Theme preference
 * Persisted to localStorage automatically via nanostores/persistent
 * Requires functional consent to persist
 */
export const $theme = persistentAtom<ThemeId>('theme', 'default', {
  encode: JSON.stringify,
  decode: (value: string) => {
    try {
      return JSON.parse(value)
    } catch {
      // Handle plain string values from legacy storage or manual setting
      // If it's a valid ThemeId, return it, otherwise return default
      const validThemes: ThemeId[] = ['default', 'dark', 'holiday']
      return validThemes.includes(value as ThemeId) ? (value as ThemeId) : 'default'
    }
  },
})

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Update theme
 * Automatically persisted to localStorage by persistentAtom
 * Only persists if functional consent is granted
 */
export function setTheme(themeId: ThemeId): void {
  try {
    const hasFunctionalConsent = $consent.get().functional

    if (hasFunctionalConsent) {
      $theme.set(themeId)
    } else {
      // Session-only: update DOM but don't persist
      document.documentElement.setAttribute('data-theme', themeId)
    }
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'themes',
      operation: 'setTheme',
    })
  }
}

// ============================================================================
// SIDE EFFECTS
// ============================================================================

/**
 * Setup theme-related side effects
 */
export function initThemeSideEffects(): void {
  // Side Effect: Update DOM and localStorage when theme changes
  $theme.subscribe((themeId) => {
    try {
      // Update DOM attribute
      document.documentElement.setAttribute('data-theme', themeId)

      // Sync to localStorage for FOUC prevention (Head/index.astro reads this on page load)
      // NOTE: This is a side effect only - nanostore is the source of truth
      try {
        localStorage.setItem('theme', themeId)
      } catch (storageError) {
        handleScriptError(storageError, {
          scriptName: 'themes',
          operation: 'syncThemeToLocalStorage',
        })
      }

      // Update meta theme-color
      const metaElement = document.querySelector('meta[name="theme-color"]')
      if (metaElement && window.metaColors) {
        metaElement.setAttribute('content', window.metaColors[themeId] || '')
      }
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'themes',
        operation: 'themeSubscription',
      })
    }
  })
}
