/**
 * Theme persistence store
 */
import { persistentAtom } from '@nanostores/persistent'
import type { ThemeId } from './@types'
import { $consent } from './cookieConsent'
import { handleScriptError } from '@components/scripts/errors'

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
      // NOTE: Don't persist 'default' - it means "use system preference"
      // NOTE: This is a side effect only - nanostore is the source of truth
      try {
        if (themeId === 'default') {
          localStorage.removeItem('theme')
        } else {
          localStorage.setItem('theme', themeId)
        }
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

  // Side Effect: Update DOM and localStorage when theme changes
  // Use .listen() instead of .subscribe() to avoid firing on initial value
  let isInitialized = false

  $theme.listen((themeId) => {
    console.log('[Theme] listen fired:', themeId, 'isInit:', isInitialized)
    // Only apply theme changes after initialization completes
    // During init, we need to wait for persistentAtom's restore to complete
    if (isInitialized) {
      applyThemeToDom(themeId)
    }
  })

  // Wait for persistentAtom's async restore() to complete before syncing
  // persistentAtom's restore is async and may fire after our init code runs
  // Use setTimeout to ensure we run after restore completes
  setTimeout(() => {
    // Guard against test environment teardown
    if (typeof document === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    // Apply the current theme after restore completes
    // Priority order:
    // 1. User's stored preference (manual selection) - highest priority
    // 2. System preference detected by HEAD script (DOM theme)
    // 3. Store default value
    const domTheme = document.documentElement.getAttribute('data-theme') as ThemeId | null
    const storedTheme = localStorage.getItem('theme') as ThemeId | null
    const storeTheme = $theme.get()
    console.log('[Theme] Init after restore - dom:', domTheme, 'stored:', storedTheme, 'store:', storeTheme)

    if (storedTheme) {
      // User has explicitly chosen a theme - apply it
      console.log('[Theme] Applying stored preference:', storedTheme)
      if (storeTheme !== storedTheme) {
        $theme.set(storedTheme as ThemeId)
      }
      applyThemeToDom(storedTheme as ThemeId)
    } else if (domTheme && domTheme !== 'default' && domTheme !== storeTheme) {
      // No stored preference, but HEAD script detected system preference
      // Sync store to match DOM without persisting
      console.log('[Theme] Syncing to system preference:', domTheme)
      $theme.set(domTheme)
      applyThemeToDom(domTheme)
    } else {
      // DOM and store are in sync, just apply current state
      console.log('[Theme] Applying current theme:', storeTheme)
      applyThemeToDom(storeTheme)
    }

    // Mark initialization complete - now listen for user theme changes
    isInitialized = true
    console.log('[Theme] Initialization complete')
  }, 100)  // Side Effect: Re-apply theme after View Transitions DOM swap
  // The inline script in Head/index.astro applies theme on initial load,
  // but View Transitions replaces the DOM, so we need to re-apply
  document.addEventListener('astro:after-swap', () => {
    const theme = $theme.get()
    applyThemeToDom(theme)
  })
}
