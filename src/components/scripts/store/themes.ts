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
import { handleScriptError } from '@components/scripts/errors'

// ============================================================================
// TYPES
// ============================================================================

export type ThemeId = 'light' | 'dark' | 'holiday' | 'a11y'

// ============================================================================
// STORES
// ============================================================================

/**
 * Theme preference
 * Persisted to localStorage automatically via nanostores/persistent
 * Classified as 'necessary' - no consent required
 */
export const $theme = persistentAtom<ThemeId>('theme', 'light', {
	encode: (value) => value,
	decode: (value: string) => {
		// Handle both JSON-stringified and plain strings
		const validThemes: ThemeId[] = ['light', 'dark', 'holiday', 'a11y']
		return validThemes.includes(value as ThemeId) ? (value as ThemeId) : 'light'
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

// ============================================================================
// THEME SYSTEM INITIALIZATION
// ============================================================================

/**
 * Initialize theme system - single source of truth for theme state management
 * Synchronizes three sources: DOM data-theme, localStorage, and $theme store
 *
 * Call this once during app bootstrap after stores are imported
 */
export function initThemeSystem(): void {
  let isInitialized = false

  /**
   * Helper: Apply theme to all three sources of truth
   * 1. DOM data-theme attribute
   * 2. localStorage (for fast HEAD script access)
   * 3. Meta theme-color tag
   */
  const syncThemeEverywhere = (themeId: ThemeId) => {
    try {
      // 1. Update DOM
      document.documentElement.setAttribute('data-theme', themeId)

      // 2. Update localStorage explicitly (persistentAtom does this for store, but we need it for HEAD script)
      try {
        localStorage.setItem('theme', themeId)
      } catch {
        // Fail silently - not critical
      }

      // 3. Update meta theme-color
      const metaElement = document.querySelector('meta[name="theme-color"]')
      if (metaElement && window.metaColors) {
        metaElement.setAttribute('content', window.metaColors[themeId] || '')
      }
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'themes',
        operation: 'syncThemeEverywhere',
      })
    }
  }

  /**
   * Initialize theme when ready (after persistentAtom restore completes)
   * Uses requestIdleCallback for better performance, with setTimeout fallback
   */
  const initWhenReady = () => {
    // Guard against test environment teardown
    if (typeof document === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      // Priority order for initial theme:
      // 1. localStorage (user explicitly chose) - highest priority
      // 2. DOM data-theme (set by HEAD script, may include system preference)
      // 3. Store default value ('light')

      const stored = localStorage.getItem('theme') as ThemeId | null
      const domTheme = document.documentElement.getAttribute('data-theme') as ThemeId | null
      const storeTheme = $theme.get()

      let finalTheme: ThemeId = storeTheme

      if (stored && stored !== storeTheme) {
        // localStorage has user preference, update store
        finalTheme = stored
        $theme.set(stored)
      } else if (domTheme && domTheme !== storeTheme && !stored) {
        // DOM has system preference (set by HEAD script), sync to store
        finalTheme = domTheme
        $theme.set(domTheme)
      }

      // Apply theme to all sources
      syncThemeEverywhere(finalTheme)

      // Mark initialization complete - now we can react to user changes
      isInitialized = true
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'themes',
        operation: 'initWhenReady',
      })
    }
  }

  // Use requestIdleCallback for better performance, or setTimeout fallback
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initWhenReady, { timeout: 100 })
  } else {
    setTimeout(initWhenReady, 0)
  }

  // React to theme changes (only after initialization completes)
  $theme.listen((themeId) => {
    if (isInitialized) {
      syncThemeEverywhere(themeId)
    }
  })

  // Handle View Transitions - re-apply theme after DOM swap
  document.addEventListener('astro:after-swap', () => {
    const theme = $theme.get()
    syncThemeEverywhere(theme)
  })
}
