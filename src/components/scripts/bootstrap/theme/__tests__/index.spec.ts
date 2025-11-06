/**
 * Unit tests for theme initialization script
 */

// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setInitialTheme } from '@components/scripts/bootstrap/theme/index'
import * as errorHandler from '@components/scripts/errors/handler'

describe('setInitialTheme', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

    // Clear all document attributes
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('lang')

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('localStorage theme handling', () => {
    it('should set theme from localStorage when available', () => {
      localStorage.setItem('theme', 'dark')

      setInitialTheme()

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('should set theme to light when stored in localStorage', () => {
      localStorage.setItem('theme', 'light')

      setInitialTheme()

      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('should set custom theme from localStorage', () => {
      localStorage.setItem('theme', 'custom-theme')

      setInitialTheme()

      expect(document.documentElement.getAttribute('data-theme')).toBe('custom-theme')
    })

    it('should handle localStorage errors gracefully', () => {
      const handleScriptErrorSpy = vi.spyOn(errorHandler, 'handleScriptError').mockReturnValue({} as any)

      // Make localStorage.getItem throw by overriding the global
      const originalGetItem = window.localStorage.getItem
      Object.defineProperty(window.localStorage, 'getItem', {
        configurable: true,
        value: vi.fn(() => {
          throw new Error('localStorage access denied')
        })
      })

      setInitialTheme()

      expect(handleScriptErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        { scriptName: 'theme-initialization', operation: 'setInitialTheme' }
      )

      // Restore original
      Object.defineProperty(window.localStorage, 'getItem', {
        configurable: true,
        value: originalGetItem
      })
    })
  })

  describe('system preference fallback', () => {
    it('should set dark theme when system prefers dark and no stored theme', () => {
      // Mock matchMedia to return dark preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      setInitialTheme()

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('should not override stored theme with system preference', () => {
      localStorage.setItem('theme', 'light')

      // Mock matchMedia to return dark preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      setInitialTheme()

      // Should keep the stored theme, not system preference
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('should not set theme when system prefers light and no stored theme', () => {
      // Mock matchMedia to return light preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false, // doesn't match dark preference
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      setInitialTheme()

      // Should not set data-theme (defaults to light in BaseLayout.astro)
      expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    })
  })

  describe('lang attribute fix', () => {
    it('should always set lang attribute to "en"', () => {
      setInitialTheme()

      expect(document.documentElement.getAttribute('lang')).toBe('en')
    })

    it('should restore lang attribute even when localStorage has theme', () => {
      localStorage.setItem('theme', 'dark')

      setInitialTheme()

      expect(document.documentElement.getAttribute('lang')).toBe('en')
    })

    it('should restore lang attribute even when localStorage throws error', () => {
      vi.spyOn(errorHandler, 'handleScriptError')
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error')
      })

      setInitialTheme()

      expect(document.documentElement.getAttribute('lang')).toBe('en')
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete flow: stored theme + lang attribute', () => {
      localStorage.setItem('theme', 'dark')

      setInitialTheme()

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(document.documentElement.getAttribute('lang')).toBe('en')
    })

    it('should handle complete flow: system preference + lang attribute', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      setInitialTheme()

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(document.documentElement.getAttribute('lang')).toBe('en')
    })

    it('should handle error gracefully and still set lang attribute', () => {
      const handleScriptErrorSpy = vi.spyOn(errorHandler, 'handleScriptError').mockReturnValue({} as any)

      // Make localStorage.getItem throw
      const originalGetItem = window.localStorage.getItem
      Object.defineProperty(window.localStorage, 'getItem', {
        configurable: true,
        value: vi.fn(() => {
          throw new Error('localStorage unavailable')
        })
      })

      setInitialTheme()

      expect(handleScriptErrorSpy).toHaveBeenCalled()
      expect(document.documentElement.getAttribute('lang')).toBe('en')

      // Restore original
      Object.defineProperty(window.localStorage, 'getItem', {
        configurable: true,
        value: originalGetItem
      })
    })
  })
})
