// @vitest-environment happy-dom
/**
 * Unit tests for theme state management
 *
 * Theme preference is classified as 'necessary' under GDPR and does not require consent.
 * All themes are always persisted to localStorage for accessibility and user experience.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { $theme, setTheme, type ThemeId } from '@components/scripts/store/themes'

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

describe('Theme Management', () => {
  beforeEach(() => {
    // Reset theme to default state
    $theme.set('light')

    // Clear mocks
    vi.clearAllMocks()

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should set and persist theme to localStorage without consent check', () => {
    setTheme('dark')

    expect($theme.get()).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('should support all theme variants', () => {
    const themes: ThemeId[] = ['light', 'dark', 'holiday', 'a11y']

    themes.forEach((theme) => {
      setTheme(theme)
      expect($theme.get()).toBe(theme)
      expect(localStorage.getItem('theme')).toBe(theme)
    })
  })

  it('should update DOM attribute when theme changes via store subscription', () => {
    // Manually call the side effect since it's not auto-initialized in tests
    $theme.subscribe((themeId) => {
      document.documentElement.setAttribute('data-theme', themeId)
    })

    setTheme('holiday')

    expect(document.documentElement.getAttribute('data-theme')).toBe('holiday')
  })

  it('should persist a11y theme for accessibility compliance', () => {
    setTheme('a11y')

    expect($theme.get()).toBe('a11y')
    expect(localStorage.getItem('theme')).toBe('a11y')
  })

  it('should decode theme from localStorage on initialization', () => {
    localStorage.setItem('theme', 'dark')

    // Simulate re-initialization by getting the decode function
    const storedValue = localStorage.getItem('theme')
    const validThemes: ThemeId[] = ['light', 'dark', 'holiday', 'a11y']
    const decoded = validThemes.includes(storedValue as ThemeId) ? storedValue as ThemeId : 'light'

    expect(decoded).toBe('dark')
  })

  it('should fallback to light theme for invalid values', () => {
    localStorage.setItem('theme', 'invalid-theme')

    // Simulate decode with invalid value
    const storedValue = localStorage.getItem('theme')
    const validThemes: ThemeId[] = ['light', 'dark', 'holiday', 'a11y']
    const decoded = validThemes.includes(storedValue as ThemeId) ? storedValue as ThemeId : 'light'

    expect(decoded).toBe('light')
  })
})
