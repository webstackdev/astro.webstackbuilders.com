/**
 * Server-side utilities for ThemePicker component
 * Functions and data used during build process in Astro frontmatter
 *
 * Theme Registry - TypeScript Configuration
 *
 * This file defines the available themes for the theme picker component.
 * It exports theme metadata that components can use to build UI and switch themes.
 *
 * IMPORTANT: When adding a new theme here, you must also update:
 * - src/styles/themes.css (add CSS custom properties for the theme)
 * - README.md (update theme documentation if needed)
 */

/**
 * Theme object interface
 */
export interface Theme {
  /** Unique identifier used in data-theme attribute */
  id: string
  /** Display name shown in theme picker */
  name: string
  /** Optional description for theme tooltip/info */
  description?: string
  /** Optional category for grouping themes */
  category?: 'core' | 'seasonal' | 'custom'
  /** Boolean flag for temporary/seasonal themes */
  seasonal?: boolean
}

/**
 * Default theme configuration interface
 */
export interface DefaultTheme {
  id: string
  prefersDarkScheme: boolean
}

/**
 * Available themes configuration
 */
export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme with blue accents',
    category: 'core',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme with navy background',
    category: 'core',
  },
  // Example of seasonal theme (uncomment and customize):
  // {
  //   id: 'holiday',
  //   name: 'Holiday',
  //   description: 'Festive red and green theme for the holidays',
  //   category: 'seasonal',
  //   seasonal: true
  // }
]

/**
 * Default theme configuration
 */
export const defaultTheme: DefaultTheme = {
  id: 'light',
  prefersDarkScheme: false,
}

/**
 * Get theme by ID
 */
export function getTheme(themeId: string): Theme | null {
  return themes.find(theme => theme.id === themeId) || null
}

/**
 * Get all themes in a specific category
 */
export function getThemesByCategory(category: Theme['category']): Theme[] {
  return themes.filter(theme => theme.category === category)
}

/**
 * Get all core (non-seasonal) themes
 */
export function getCoreThemes(): Theme[] {
  return themes.filter(theme => !theme.seasonal)
}

/**
 * Get all seasonal themes
 */
export function getSeasonalThemes(): Theme[] {
  return themes.filter(theme => theme.seasonal)
}

/**
 * Check if a theme exists
 */
export function themeExists(themeId: string): boolean {
  return themes.some(theme => theme.id === themeId)
}

/**
 * Get the next theme in the list (useful for theme cycling)
 */
export function getNextTheme(currentThemeId: string): string {
  if (themes.length === 0) return 'light'
  const currentIndex = themes.findIndex(theme => theme.id === currentThemeId)
  const nextIndex = (currentIndex + 1) % themes.length
  const nextTheme = themes[nextIndex]
  return nextTheme?.id || themes[0]?.id || 'light'
}

/**
 * Get theme display name
 */
export function getThemeName(themeId: string): string {
  const theme = getTheme(themeId)
  return theme?.name || themeId
}
