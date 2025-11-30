/**
 * Theme persistence store
 *
 * Theme preference is classified as 'necessary' under GDPR:
 * - Purely cosmetic/accessibility preference
 * - No tracking or behavioral data collection
 * - No third-party data sharing
 * - Similar to language preference (universally accepted as necessary)
 * - GDPR Recital 30: "not personal data" when used solely for technical delivery
 */
import { persistentAtom } from '@nanostores/persistent'
import { StoreController } from '@nanostores/lit'
import type { ReactiveControllerHost } from 'lit'
import { handleScriptError } from '@components/scripts/errors/handler'

// ============================================================================
// TYPES
// ============================================================================

export type ThemeId = 'light' | 'dark' | 'holiday' | 'a11y'

const validThemes: ThemeId[] = ['light', 'dark', 'holiday', 'a11y']
const fallbackTheme: ThemeId = 'light'
const themeStorageKey = 'theme'

const persistThemeSafely = (value: ThemeId): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(themeStorageKey, value)
  } catch {
    // Ignore write failures (Safari private mode, etc.)
  }
}

const normalizeThemeValue = (rawValue: string): ThemeId | null => {
  if (validThemes.includes(rawValue as ThemeId)) {
    return rawValue as ThemeId
  }

  try {
    const parsedValue = JSON.parse(rawValue)
    if (typeof parsedValue === 'string' && validThemes.includes(parsedValue as ThemeId)) {
      return parsedValue as ThemeId
    }
  } catch {
    // Swallow JSON parse errors and fall through to fallback handling
  }

  return null
}

const getInitialThemePreference = (): ThemeId => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallbackTheme
  }

  try {
    const stored = window.localStorage?.getItem('theme')
    if (stored && validThemes.includes(stored as ThemeId)) {
      return stored as ThemeId
    }
  } catch {
    // Ignore localStorage access issues (Safari private mode, etc.)
  }

  try {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch {
    // matchMedia unsupported - fall through to default
  }

  return fallbackTheme
}

// ============================================================================
// STORES
// ============================================================================

/**
 * Theme preference
 * Persisted to localStorage automatically via nanostores/persistent
 * Classified as 'necessary' - no consent required
 */
export const $theme = persistentAtom<ThemeId>(themeStorageKey, getInitialThemePreference(), {
  encode: (value) => value,
  decode: (value: string) => {
    const normalizedValue = normalizeThemeValue(value)
    if (normalizedValue) {
      return normalizedValue
    }

    persistThemeSafely(fallbackTheme)
    return fallbackTheme
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
 * Classified as 'necessary' - always persists, no consent check required
 */
export function setTheme(themeId: ThemeId): void {
  try {
    // Theme is 'necessary' - always persist to localStorage
    $theme.set(themeId)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'themes',
      operation: 'setTheme',
    })
  }
}

/**
 * Open the theme picker modal
 */
export function openThemePicker(): void {
  try {
    $themePickerOpen.set(true)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'themes',
      operation: 'openThemePicker',
    })
  }
}

/**
 * Close the theme picker modal
 */
export function closeThemePicker(): void {
  try {
    $themePickerOpen.set(false)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'themes',
      operation: 'closeThemePicker',
    })
  }
}

/**
 * Toggle the theme picker modal open/closed
 */
export function toggleThemePicker(): void {
  try {
    $themePickerOpen.set(!$themePickerOpen.get())
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'themes',
      operation: 'toggleThemePicker',
    })
  }
}

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Create a reactive StoreController for $theme
 * For use in Lit components - automatically triggers re-render when theme changes
 */
export function createThemeController(host: ReactiveControllerHost): StoreController<ThemeId> {
  return new StoreController(host, $theme)
}

/**
 * Create a reactive StoreController for $themePickerOpen
 * For use in Lit components - automatically triggers re-render when picker state changes
 */
export function createThemePickerOpenController(host: ReactiveControllerHost): StoreController<boolean> {
  return new StoreController(host, $themePickerOpen)
}

// ============================================================================
// SIDE EFFECTS
// ============================================================================

/**
 * Apply theme value to all three sources of truth when it changes. This
 * system is to allow fast application of the theme setting on page load
 * to avoid FOUC.
 *
 * 1. DOM data-theme attribute
 * 2. localStorage (for fast HEAD script access)
 * 3. Meta theme-color tag
 */
export function themeKeyChangeSideEffectsListener(): void {
  $theme.listen((themeId: ThemeId) => {
    try {
      // 1. Update <html> element data-theme attribute
      document.documentElement.dataset['theme'] = themeId

      // 2. Update localStorage explicitly for use in quick-checks to prevent FOUC
      try {
        localStorage.setItem('theme', themeId)
      } catch (error) {
        console.error('❌ Could not update localstorage with theme change:', error)
      }

      // 3. Update meta theme-color, used in PWAs
      const metaElement = document.querySelector('meta[name="theme-color"]')
      if (metaElement && window.metaColors) {
        metaElement.setAttribute('content', window.metaColors[themeId] || '')
      }
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'themes',
        operation: 'themeKeyChangeSideEffectsListener',
      })
    }
  })
}
