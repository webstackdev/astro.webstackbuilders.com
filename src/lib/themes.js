/**
 * Theme Registry - JavaScript Configuration
 *
 * This file defines the available themes for the theme picker component.
 * It exports theme metadata that components can use to build UI and switch themes.
 *
 * IMPORTANT: When adding a new theme here, you must also update:
 * - src/styles/themes.css (add CSS custom properties for the theme)
 * - README.md (update theme documentation if needed)
 *
 * Theme Object Structure:
 * - id: Unique identifier used in data-theme attribute
 * - name: Display name shown in theme picker
 * - description: Optional description for theme tooltip/info
 * - category: Optional category for grouping themes
 * - seasonal: Boolean flag for temporary/seasonal themes
 */

/**
 * Available themes configuration
 * @type {Array<{id: string, name: string, description?: string, category?: string, seasonal?: boolean}>}
 */
export const themes = [
  {
    id: 'default',
    name: 'Light',
    description: 'Clean light theme with blue accents',
    category: 'core'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme with navy background',
    category: 'core'
  }
  // Example of seasonal theme (uncomment and customize):
  // {
  //   id: 'holiday',
  //   name: 'Holiday',
  //   description: 'Festive red and green theme for the holidays',
  //   category: 'seasonal',
  //   seasonal: true
  // }
];

/**
 * Default theme configuration
 */
export const defaultTheme = {
  id: 'default',
  prefersDarkScheme: false
};

/**
 * Get theme by ID
 * @param {string} themeId - The theme identifier
 * @returns {object|null} Theme object or null if not found
 */
export function getTheme(themeId) {
  return themes.find(theme => theme.id === themeId) || null;
}

/**
 * Get all themes in a specific category
 * @param {string} category - The category to filter by
 * @returns {Array<object>} Array of theme objects
 */
export function getThemesByCategory(category) {
  return themes.filter(theme => theme.category === category);
}

/**
 * Get all core (non-seasonal) themes
 * @returns {Array<object>} Array of core theme objects
 */
export function getCoreThemes() {
  return themes.filter(theme => !theme.seasonal);
}

/**
 * Get all seasonal themes
 * @returns {Array<object>} Array of seasonal theme objects
 */
export function getSeasonalThemes() {
  return themes.filter(theme => theme.seasonal);
}

/**
 * Check if a theme exists
 * @param {string} themeId - The theme identifier
 * @returns {boolean} True if theme exists
 */
export function themeExists(themeId) {
  return themes.some(theme => theme.id === themeId);
}

/**
 * Get the next theme in the list (useful for theme cycling)
 * @param {string} currentThemeId - Current theme ID
 * @returns {string} Next theme ID
 */
export function getNextTheme(currentThemeId) {
  if (themes.length === 0) return 'default';
  const currentIndex = themes.findIndex(theme => theme.id === currentThemeId);
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];
  return nextTheme?.id || themes[0]?.id || 'default';
}

/**
 * Get theme display name
 * @param {string} themeId - The theme identifier
 * @returns {string} Display name or the ID if theme not found
 */
export function getThemeName(themeId) {
  const theme = getTheme(themeId);
  return theme && typeof theme === 'object' && 'name' in theme ? String(theme.name) : themeId;
}