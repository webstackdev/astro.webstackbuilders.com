// @vitest-environment happy-dom
/**
 * Unit tests for theme state management
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { $theme, setTheme } from '@components/scripts/store/themes'
import { $consent, updateConsent } from '@components/scripts/store/consent'

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
    // Reset stores to default state
    $consent.set({
      necessary: true,
      analytics: false,
      advertising: false,
      functional: false,
    })
    $theme.set('light')

    // Clear mocks
    vi.clearAllMocks()

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should set theme when functional consent is granted', () => {
    updateConsent('functional', true)

    setTheme('dark')

    expect($theme.get()).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('should not persist theme when functional consent is denied', () => {
    updateConsent('functional', false)

    setTheme('dark')

    // Theme not persisted to store or localStorage
    expect($theme.get()).toBe('light') // Still light
    expect(localStorage.getItem('theme')).toBeNull()

    // But DOM should be updated
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should update DOM attribute when theme changes via store subscription', () => {
    updateConsent('functional', true)

    // Manually call the side effect since it's not auto-initialized in tests
    $theme.subscribe((themeId) => {
      document.documentElement.setAttribute('data-theme', themeId)
    })

    setTheme('holiday')

    expect(document.documentElement.getAttribute('data-theme')).toBe('holiday')
  })
})
