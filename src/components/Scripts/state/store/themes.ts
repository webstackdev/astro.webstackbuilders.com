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
  encode: (value) => value,
  decode: (value: string) => {
    // Handle both JSON-stringified values (for backwards compatibility) and plain strings
    if (value.startsWith('"') && value.endsWith('"')) {
      try {
        return JSON.parse(value)
      } catch {
        return 'default'
      }
    }
    // Handle plain string values
    const validThemes: ThemeId[] = ['default', 'dark', 'holiday']
    return validThemes.includes(value as ThemeId) ? (value as ThemeId) : 'default'
  },
})

/**
 * Theme picker modal visibility state
 * Persisted to localStorage (via persistentAtom) so it survives View Transitions
 * and page reloads. This keeps the modal open during navigation for better UX.
 */
export const $themePickerOpen = persistentAtom<boolean>('themePickerOpen', false, {
  encode: (value) => JSON.stringify(value),
  decode: (value: string) => {
    try {
      return JSON.parse(value)
    } catch {
      return false
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
  // Helper function to apply theme to DOM
  const applyThemeToDom = (themeId: ThemeId) => {
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
        operation: 'applyThemeToDom',
      })
    }
  }

  // Apply the current theme immediately on initialization
  // This ensures the theme from localStorage is applied to the DOM
  const currentTheme = $theme.get()
  applyThemeToDom(currentTheme)

  // Side Effect: Update DOM and localStorage when theme changes
  $theme.subscribe((themeId) => {
    applyThemeToDom(themeId)
  })
}
