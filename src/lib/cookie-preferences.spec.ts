import { describe, it, expect, beforeEach, vi } from 'vitest'
import CookiePreferencesManager from './cookie-preferences'

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
})

// Mock DOM elements
const mockElement = (id: string, checked = false) => ({
  id,
  checked,
  addEventListener: vi.fn(),
}) as unknown as HTMLInputElement

describe('CookiePreferencesManager', () => {
  let manager: CookiePreferencesManager
  let mockGetElementById: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock document.getElementById
    mockGetElementById = vi.fn()
    global.document.getElementById = mockGetElementById

    // Mock document.addEventListener
    global.document.addEventListener = vi.fn()

    // Mock document.body.appendChild and removeChild
    global.document.body.appendChild = vi.fn()
    global.document.body.removeChild = vi.fn()

    // Mock document.createElement
    global.document.createElement = vi.fn().mockReturnValue({
      className: '',
      textContent: '',
      style: {},
      parentNode: document.body,
    })

    // Reset document.cookie
    document.cookie = ''
  })

  describe('Constructor and Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        manager = new CookiePreferencesManager()
      }).not.toThrow()
    })

    it('should set up event listeners on initialization', () => {
      const mockAllowBtn = mockElement('cookie-allow-all')
      const mockSaveBtn = mockElement('cookie-save-preferences')

      mockGetElementById
        .mockReturnValueOnce(mockAllowBtn)
        .mockReturnValueOnce(mockSaveBtn)

      manager = new CookiePreferencesManager()

      expect(mockAllowBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      expect(mockSaveBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
    })
  })

  describe('Cookie Operations', () => {
    beforeEach(() => {
      // Mock required DOM elements
      mockGetElementById.mockImplementation((id: string) => {
        if (id === 'cookie-allow-all' || id === 'cookie-save-preferences') {
          return mockElement(id)
        }
        if (id.includes('-cookies')) {
          return mockElement(id, false)
        }
        return null
      })

      manager = new CookiePreferencesManager()
    })

    it('should save preferences correctly', () => {
      const mockAnalytics = mockElement('analytics-cookies', true)
      const mockFunctional = mockElement('functional-cookies', false)
      const mockAdvertising = mockElement('advertising-cookies', true)

      mockGetElementById
        .mockReturnValueOnce(mockAnalytics)
        .mockReturnValueOnce(mockFunctional)
        .mockReturnValueOnce(mockAdvertising)

      manager.savePreferences()

      // Check that cookie was set (document.cookie would be modified)
      expect(document.cookie).toContain('webstack-cookie-consent=')
    })

    it('should enable all cookies when allowAll is called', () => {
      const mockAnalytics = mockElement('analytics-cookies', false)
      const mockFunctional = mockElement('functional-cookies', false)
      const mockAdvertising = mockElement('advertising-cookies', false)

      mockGetElementById
        .mockReturnValue(mockAnalytics)
        .mockReturnValueOnce(mockAnalytics)
        .mockReturnValueOnce(mockFunctional)
        .mockReturnValueOnce(mockAdvertising)

      manager.allowAll()

      expect(mockAnalytics.checked).toBe(true)
      expect(mockFunctional.checked).toBe(true)
      expect(mockAdvertising.checked).toBe(true)
    })
  })

  describe('Notification System', () => {
    beforeEach(() => {
      mockGetElementById.mockReturnValue(mockElement('test'))
      manager = new CookiePreferencesManager()
    })

    it('should show notification with correct message', () => {
      const testMessage = 'Test notification'
      const mockDiv = {
        className: '',
        textContent: '',
        style: {},
      }

      global.document.createElement = vi.fn().mockReturnValue(mockDiv)

      manager.showNotification(testMessage)

      expect(document.createElement).toHaveBeenCalledWith('div')
      expect(mockDiv.textContent).toBe(testMessage)
      expect(mockDiv.className).toContain('fixed top-4 right-4')
      expect(document.body.appendChild).toHaveBeenCalledWith(mockDiv)
    })
  })

  describe('Preference Loading', () => {
    beforeEach(() => {
      mockGetElementById.mockImplementation((id: string) => {
        if (id.includes('-cookies')) {
          return mockElement(id, false)
        }
        return mockElement(id)
      })
    })

    it('should load preferences from cookie if available', () => {
      const testPreferences = {
        necessary: true,
        analytics: true,
        functional: false,
        advertising: true,
        timestamp: new Date().toISOString()
      }

      // Set up cookie
      document.cookie = `webstack-cookie-consent=${JSON.stringify(testPreferences)}`

      manager = new CookiePreferencesManager()
      const result = manager.loadPreferences()

      expect(result).toEqual(testPreferences)
    })

    it('should return null if no preferences cookie exists', () => {
      manager = new CookiePreferencesManager()
      const result = manager.loadPreferences()

      expect(result).toBeNull()
    })
  })
})