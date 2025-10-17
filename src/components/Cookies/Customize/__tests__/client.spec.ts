// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CookieCustomize } from '../client'

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
  style: {},
}) as unknown as HTMLInputElement

const mockButton = (id: string): HTMLButtonElement => {
  const button = document.createElement('button')
  button.id = id
  return button
}

const mockDiv = (id: string): HTMLDivElement => {
  const div = document.createElement('div')
  div.id = id
  div.style.display = 'none'
  return div
}

describe('CookieCustomize', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Reset document.cookie
    document.cookie = ''

    // Clear document body
    document.body.innerHTML = ''
  })

  describe('LoadableScript Static Methods', () => {
    it('should have correct scriptName', () => {
      expect(CookieCustomize.scriptName).toBe('CookieCustomize')
    })

    it('should have correct eventType', () => {
      expect(CookieCustomize.eventType).toBe('astro:page-load')
    })

    it('should initialize without errors when DOM elements exist', () => {
      // Create actual DOM elements
      const mockModal = mockDiv('cookie-customize-modal-id')
      const mockCloseBtn = mockButton('cookie-modal__close-btn')
      mockCloseBtn.classList.add('cookie-modal__close-btn')
      const mockAllowBtn = mockButton('cookie-allow-all')
      const mockSaveBtn = mockButton('cookie-save-preferences')

      // Add elements to the document
      document.body.appendChild(mockModal)
      document.body.appendChild(mockCloseBtn)
      document.body.appendChild(mockAllowBtn)
      document.body.appendChild(mockSaveBtn)

      expect(() => {
        CookieCustomize.init()
      }).not.toThrow()

      // Cleanup
      document.body.removeChild(mockModal)
      document.body.removeChild(mockCloseBtn)
      document.body.removeChild(mockAllowBtn)
      document.body.removeChild(mockSaveBtn)
    })
  })

  describe('Instance Methods', () => {
    let instance: CookieCustomize
    let mockModal: HTMLDivElement
    let mockCloseBtn: HTMLButtonElement
    let mockAllowBtn: HTMLButtonElement
    let mockSaveBtn: HTMLButtonElement

    beforeEach(() => {
      mockModal = mockDiv('cookie-customize-modal-id')
      mockCloseBtn = mockButton('cookie-modal__close-btn')
      mockCloseBtn.classList.add('cookie-modal__close-btn')
      mockAllowBtn = mockButton('cookie-allow-all')
      mockSaveBtn = mockButton('cookie-save-preferences')

      // Add elements to the document
      document.body.appendChild(mockModal)
      document.body.appendChild(mockCloseBtn)
      document.body.appendChild(mockAllowBtn)
      document.body.appendChild(mockSaveBtn)

      instance = new CookieCustomize()
    })

    afterEach(() => {
      // Cleanup
      document.body.removeChild(mockModal)
      document.body.removeChild(mockCloseBtn)
      document.body.removeChild(mockAllowBtn)
      document.body.removeChild(mockSaveBtn)
    })

    describe('Modal Operations', () => {
      it('should show modal', () => {
        instance.showModal()
        expect(instance['modal'].style.display).toBe('flex')
      })

      it('should hide modal', () => {
        instance.hideModal()
        expect(instance['modal'].style.display).toBe('none')
      })
    })

    describe('Cookie Preferences', () => {
      it('should save preferences correctly', () => {
        // Create checkbox elements
        const analyticsCheckbox = document.createElement('input')
        analyticsCheckbox.type = 'checkbox'
        analyticsCheckbox.id = 'analytics-cookies'
        analyticsCheckbox.checked = true

        const functionalCheckbox = document.createElement('input')
        functionalCheckbox.type = 'checkbox'
        functionalCheckbox.id = 'functional-cookies'
        functionalCheckbox.checked = false

        const advertisingCheckbox = document.createElement('input')
        advertisingCheckbox.type = 'checkbox'
        advertisingCheckbox.id = 'advertising-cookies'
        advertisingCheckbox.checked = true

        // Add to document
        document.body.appendChild(analyticsCheckbox)
        document.body.appendChild(functionalCheckbox)
        document.body.appendChild(advertisingCheckbox)

        instance.savePreferences()

        // Check that cookie was set
        expect(document.cookie).toContain('webstack-cookie-consent=')

        // Cleanup
        document.body.removeChild(analyticsCheckbox)
        document.body.removeChild(functionalCheckbox)
        document.body.removeChild(advertisingCheckbox)
      })

      it('should enable all cookies when allowAll is called', () => {
        // Create checkbox elements
        const analyticsCheckbox = document.createElement('input')
        analyticsCheckbox.type = 'checkbox'
        analyticsCheckbox.id = 'analytics-cookies'
        analyticsCheckbox.checked = false

        const functionalCheckbox = document.createElement('input')
        functionalCheckbox.type = 'checkbox'
        functionalCheckbox.id = 'functional-cookies'
        functionalCheckbox.checked = false

        const advertisingCheckbox = document.createElement('input')
        advertisingCheckbox.type = 'checkbox'
        advertisingCheckbox.id = 'advertising-cookies'
        advertisingCheckbox.checked = false

        // Add to document
        document.body.appendChild(analyticsCheckbox)
        document.body.appendChild(functionalCheckbox)
        document.body.appendChild(advertisingCheckbox)

        instance.allowAll()

        expect(analyticsCheckbox.checked).toBe(true)
        expect(functionalCheckbox.checked).toBe(true)
        expect(advertisingCheckbox.checked).toBe(true)

        // Cleanup
        document.body.removeChild(analyticsCheckbox)
        document.body.removeChild(functionalCheckbox)
        document.body.removeChild(advertisingCheckbox)
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

        const result = instance.loadPreferences()

        expect(result).toEqual(testPreferences)
      })

      it('should return null if no preferences cookie exists', () => {
        document.cookie = ''
        const result = instance.loadPreferences()

        expect(result).toBeNull()
      })
    })

    describe('Notification System', () => {
      it('should show notification with correct message', () => {
        const testMessage = 'Test notification'

        // Test that the notification method can be called without errors
        expect(() => {
          instance.showNotification(testMessage)
        }).not.toThrow()
      })
    })
  })
})
