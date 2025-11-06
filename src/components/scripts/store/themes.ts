/**
 * Theme persistence store
 */
import { persistentAtom } from '@nanostores/persistent'
import { $consent } from './consent'
import { handleScriptError } from '@components/scripts/errors'

// ============================================================================
// TYPES
// ============================================================================

export type ThemeId = 'default' | 'dark' | 'holiday'

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
      // Only persist non-default themes to localStorage
      // 'default' means "no preference" so we check system preference instead
      if (themeId === 'default') {
        // Remove stored preference so system preference will be used
        localStorage.removeItem('theme')
      } else {
        $theme.set(themeId)
      }
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
