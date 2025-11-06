import { handleScriptError } from '@components/scripts/errors/handler'

/**
 * Set theme name on <html> element from storage
 * early to prevent flash of unstyled content.
 */
// @TODO: This will give a flash of the incorrect theme. The theme selector set on <html> will show before this script has a chance to run. Also, the theme is being changed to "default" somewhere which selects for nothing in the current setup.
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
