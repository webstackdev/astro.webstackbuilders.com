/**
 * This is ran from <head> in a base layout to avoid a "flash of un-themed styling"
 */
import storage from "@data/storage"
import themes from "@data/themes.json"

export const themeSetup = () => {
  /**
   * Set an attribute named data-theme on the <html> element and
   * set it to the value of the theme key in localstorage.
   */
  document.documentElement.setAttribute(
    'data-theme',
    localStorage.getItem(storage.THEME_STORAGE_KEY) ?? 'default'
  )

  /**
   * Used to update the <meta name="theme-color" content="VALID_COLOR"> element when
   * the theme is changed, that tag sets the color for e.g. the browser title bar
   */
  themes.forEach((theme) => {
    window.metaColors[theme.id] = theme.colors.backgroundOffset
  });
}
