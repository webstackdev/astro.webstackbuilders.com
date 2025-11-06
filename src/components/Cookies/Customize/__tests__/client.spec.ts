// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CookieCustomize } from '@components/Cookies/Customize/client'
import { AppBootstrap } from '@components/scripts/bootstrap'
import { $consent } from '@components/scripts/store'

// Mock document.cookie with proper getter/setter behavior
let cookieStorage: string[] = []

Object.defineProperty(document, 'cookie', {
  get() {
    return cookieStorage.join('; ')
  },
  set(value: string) {
    // Parse the cookie string (name=value; options...)
    const parts = value.split(';')
    const nameValue = parts[0]
    if (!nameValue) return

    const [name] = nameValue.split('=')
    if (!name) return

    // Remove existing cookie with same name
    cookieStorage = cookieStorage.filter(cookie => !cookie.startsWith(`${name}=`))

    // Add new cookie
    cookieStorage.push(nameValue)
  },
  configurable: true,
})

// Mock DOM elements
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
    // Initialize state management
    AppBootstrap.init()

    // Reset mocks
    vi.clearAllMocks()

    // Reset cookies
    cookieStorage = []

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

        // Check that consent was updated in state store (which updates cookies automatically)
        expect(document.cookie).toContain('consent_analytics=true')
        expect(document.cookie).toContain('consent_advertising=true')

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

      it('should load preferences from state store', () => {
        // Set consent in state store
        $consent.set({
          necessary: true,
          analytics: true,
          functional: false,
          advertising: true,
        })

        const result = instance.loadPreferences()

        expect(result).toMatchObject({
          necessary: true,
          analytics: true,
          functional: false,
          advertising: true,
        })
      })

      it('should return preferences object even if no custom preferences exist', () => {
        // State store always has default values
        const result = instance.loadPreferences()

        expect(result).toMatchObject({
          necessary: true,
          analytics: expect.any(Boolean),
          functional: expect.any(Boolean),
          advertising: expect.any(Boolean),
        })
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
