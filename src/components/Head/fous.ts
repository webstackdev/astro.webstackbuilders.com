/**
 * This is ran from <head> in a base layout to avoid a "flash of un-themed styling"
 */
// Note: This file runs in the browser, so we can't import content collections directly
// Instead, we'll use the storage keys directly since this is client-side code

export const themeSetup = () => {
  /**
   * Set an attribute named data-theme on the <html> element and
   * set it to the value of the theme key in localstorage.
   */
  document.documentElement.setAttribute(
    'data-theme',
    localStorage.getItem('theme') ?? 'default'
  )

  /**
   * Used to update the <meta name="theme-color" content="VALID_COLOR"> element when
   * the theme is changed, that tag sets the color for e.g. the browser title bar
   */
  const themes = [
    { id: 'default', colors: { backgroundOffset: '#e2e2e2' } },
    { id: 'dark', colors: { backgroundOffset: '#00386d' } }
  ];

  // Initialize metaColors on window if it doesn't exist
  if (typeof window !== 'undefined') {
    (window as any).metaColors = (window as any).metaColors || {};
    themes.forEach((theme) => {
      (window as any).metaColors[theme.id] = theme.colors.backgroundOffset;
    });
  }
}
