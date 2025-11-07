import { handleScriptError } from '@components/scripts/errors/handler'
import type { ThemeId } from '@components/scripts/store/@types'
import { $theme } from '@components/scripts/store/themes'

/**
 * Set theme name on <html> element from storage
 * early to prevent flash of unstyled content.
 */
// @TODO: This will give a flash of the incorrect theme. The theme selector set on <html> will show before this script has a chance to run. Also, the theme is being changed to "default" somewhere which selects for nothing in the current setup.
// @TODO: Called from components/Head/index.astro
export const setInitialTheme = () => {
  /** 1. If there is a stored theme in localstorage, it takes priority */
  let themeSet = false
  try {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme)
      themeSet = true
    }
  } catch (error) {
    handleScriptError(error, { scriptName: 'theme-initialization', operation: 'setInitialTheme' })
  }
  /** 2. If no stored theme and system preference is "dark", set to dark theme */
  if (!themeSet && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
  /**
   * 3. If no stored theme and no system preference, light theme
   * is set by default in BaseLayout.astro
   */

  /**
   * Make sure Astro View Transitions hasn't removed lang tag from <html>
   * after modifying attributes with <html date-theme="{theme}">. This is
   * a known bug with Astro View Transitions.
   */
  document.documentElement.setAttribute('lang', 'en')
}

// @TODO: Moved from scripts/store/themes.ts
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
    } else if (domTheme && domTheme !== 'light' && domTheme !== storeTheme) {
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
