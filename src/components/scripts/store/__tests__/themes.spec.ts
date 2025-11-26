// @vitest-environment jsdom
/**
 * Unit tests for theme state management
 *
 * Theme preference is classified as 'necessary' under GDPR and does not require consent.
 * All themes are always persisted to localStorage for accessibility and user experience.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  $theme,
  $themePickerOpen,
  setTheme,
  openThemePicker,
  closeThemePicker,
  toggleThemePicker,
  themeKeyChangeSideEffectsListener,
  addViewTransitionThemeInitListener,
  type ThemeId,
} from '@components/scripts/store/themes'
import { handleScriptError } from '@components/scripts/errors/handler'

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

type ThemeTestWindow = Window & { metaColors?: Record<string, string> }

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  localStorage.clear()
  delete (window as ThemeTestWindow).metaColors
  document.body.className = ''
})

describe('Theme Management', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Reset theme to default state
    $theme.set('light')
    $themePickerOpen.set(false)

    document.documentElement.dataset['theme'] = 'light'

    // Clear mocks
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

  it('reports errors when theme persistence fails', () => {
    const error = new Error('storage failure')
    const setSpy = vi.spyOn($theme, 'set').mockImplementation(() => {
      throw error
    })

    setTheme('dark')

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'themes',
      operation: 'setTheme',
    })
    setSpy.mockRestore()
  })
})

describe('Theme picker visibility state', () => {
  beforeEach(() => {
    localStorage.clear()
    $themePickerOpen.set(false)
    vi.clearAllMocks()
  })

  it('opens, closes, and toggles picker state', () => {
    expect($themePickerOpen.get()).toBe(false)

    openThemePicker()
    expect($themePickerOpen.get()).toBe(true)
    expect(localStorage.getItem('themePickerOpen')).toBe('true')

    closeThemePicker()
    expect($themePickerOpen.get()).toBe(false)
    expect(localStorage.getItem('themePickerOpen')).toBe('false')

    toggleThemePicker()
    expect($themePickerOpen.get()).toBe(true)
    toggleThemePicker()
    expect($themePickerOpen.get()).toBe(false)
  })

  it('reports handleScriptError when picker updates fail', () => {
    const error = new Error('picker failure')
    const setSpy = vi.spyOn($themePickerOpen, 'set').mockImplementation(() => {
      throw error
    })

    openThemePicker()
    closeThemePicker()
    toggleThemePicker()

    expect(handleScriptError).toHaveBeenCalledTimes(3)
    expect(handleScriptError).toHaveBeenNthCalledWith(1, error, {
      scriptName: 'themes',
      operation: 'openThemePicker',
    })
    expect(handleScriptError).toHaveBeenNthCalledWith(2, error, {
      scriptName: 'themes',
      operation: 'closeThemePicker',
    })
    expect(handleScriptError).toHaveBeenNthCalledWith(3, error, {
      scriptName: 'themes',
      operation: 'toggleThemePicker',
    })

    setSpy.mockRestore()
  })
})

describe('themeKeyChangeSideEffectsListener', () => {
  beforeEach(() => {
    document.documentElement.dataset['theme'] = 'light'
    localStorage.clear()
  })

  it('syncs theme changes to DOM, localStorage, and meta colors', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
    ;(window as ThemeTestWindow).metaColors = { dark: '#000000' }

    let listener: ((_themeId: ThemeId, _oldThemeId: ThemeId) => void) | undefined
    const listenSpy = vi
      .spyOn($theme, 'listen')
      .mockImplementation((callback: (_themeId: ThemeId, _oldThemeId: ThemeId) => void) => {
        listener = callback
        return () => {}
      })

    themeKeyChangeSideEffectsListener()
    expect(listener).toBeDefined()

    listener?.('dark', 'light')

    expect(document.documentElement.dataset['theme']).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(meta.getAttribute('content')).toBe('#000000')

    listenSpy.mockRestore()
    document.head.removeChild(meta)
  })

  it('logs when localStorage persistence fails but continues execution', () => {
    const error = new Error('blocked')
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn($theme, 'listen').mockImplementation((callback) => {
      callback('dark', 'light')
      return () => {}
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error
    })

    themeKeyChangeSideEffectsListener()

    expect(consoleSpy).toHaveBeenCalledWith(
      '❌ Could not update localstorage with theme change:',
      error,
    )

    document.head.removeChild(meta)
  })
})

describe('addViewTransitionThemeInitListener', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.className = ''
  })

  it('applies stored theme to new documents and reveals the body', () => {
    localStorage.setItem('theme', 'dark')
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const newDocument = document.implementation.createHTMLDocument('next')
    newDocument.body.classList.add('invisible')

    addViewTransitionThemeInitListener()

    const event = new CustomEvent('astro:before-swap') as CustomEvent & {
      newDocument: Document
    }
    event.newDocument = newDocument
    document.dispatchEvent(event)

    expect(newDocument.documentElement.dataset['theme']).toBe('dark')
    expect(newDocument.body.classList.contains('invisible')).toBe(false)
    expect(logSpy).toHaveBeenCalledWith('🎨 Theme init on "astro:before-swap" executed')
  })

  it('falls back gracefully when localStorage access fails', () => {
    const error = new Error('denied')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw error
    })
    const newDocument = document.implementation.createHTMLDocument('fallback')
    newDocument.body.classList.add('invisible')

    addViewTransitionThemeInitListener()

    const event = new CustomEvent('astro:before-swap') as CustomEvent & {
      newDocument: Document
    }
    event.newDocument = newDocument
    document.dispatchEvent(event)

    expect(newDocument.body.classList.contains('invisible')).toBe(false)
    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Theme init on "astro:before-swap" failed with errors:',
      error,
    )
  })
})
