/**
 * This is ran from <head> in a base layout to avoid a "flash of un-themed styling"
 */

export const themeSetup = () => {
  /**
   * Used to update the <meta name="theme-color" content="VALID_COLOR"> element when
   * the theme is changed, that tag sets the color for e.g. the browser title bar
   */
  const themes = [
    { id: 'default', colors: { backgroundOffset: '#e2e2e2' } },
    { id: 'dark', colors: { backgroundOffset: '#00386d' } },
  ]

  /**
   * The `window.metaColors` global variable is used to set the color on the
   * `<meta name="theme-color" content="CSS_VAR">` when the theme changes. This
   * element is  used by the browser for UI surrounding the page like title bars.
   */
  if (typeof window !== 'undefined') {
    ;(window as any).metaColors = (window as any).metaColors || {}
    themes.forEach(theme => {
      ;(window as any).metaColors[theme.id] = theme.colors.backgroundOffset
    })
  }
}
