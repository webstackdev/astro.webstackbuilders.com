// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ConsentPreferencesElement } from '@components/Consent/Preferences/client'
import { $consent, updateConsent, allowAllConsent } from '@components/scripts/store'

// Mock dependencies
vi.mock('@components/scripts/store', () => ({
  $consent: {
    get: vi.fn(),
    set: vi.fn(),
  },
  updateConsent: vi.fn(),
  allowAllConsent: vi.fn(),
  createConsentController: vi.fn(() => ({
    value: {
      analytics: false,
      functional: true,
      marketing: false,
      DataSubjectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Valid UUID format
    },
  })),
}))

// Mock bootstrap initialization
const mockBootstrap = {
  init: vi.fn(),
}

vi.mock('@components/scripts/bootstrap', () => ({
  AppBootstrap: mockBootstrap,
}))

// Mock toast controller
const mockToastController = {
  show: vi.fn(),
}

vi.mock('@components/Toasts/controller', () => ({
  ToastController: mockToastController,
}))

// DOM element creation helpers
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

const mockCheckbox = (id: string): HTMLInputElement => {
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.id = id
  return input
}

// Mock cookie storage for cleanup
let cookieStorage: any[] = []

Object.defineProperty(document, 'cookie', {
  get: () => cookieStorage.join('; '),
  set: (value) => {
    cookieStorage.push(value)
  },
  configurable: true,
})

describe('ConsentPreferencesElement', () => {
  beforeEach(() => {
    // Initialize state management
    mockBootstrap.init()

    // Reset mocks
    vi.clearAllMocks()

    // Reset cookies
    cookieStorage = []

    // Clear document body
    document.body.innerHTML = ''

    // Mock default consent state
    vi.mocked($consent.get).mockReturnValue({
      analytics: false,
      functional: false,
      marketing: false,
      DataSubjectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Valid UUID format
    })
  })

  describe('Web Component Registration', () => {
    it('should be registered as custom element', () => {
      expect(customElements.get('consent-preferences')).toBeDefined()
    })
  })

  describe('Component Interaction', () => {
    let element: ConsentPreferencesElement
    let mockModal: HTMLDivElement
    let mockCloseBtn: HTMLButtonElement
    let mockAllowBtn: HTMLButtonElement
    let mockSaveBtn: HTMLButtonElement

    beforeEach(() => {
      // Create mock DOM structure
      mockModal = mockDiv('consent-modal-modal-id')
      mockCloseBtn = mockButton('consent-modal__close-btn')
      mockCloseBtn.classList.add('consent-modal__close-btn')
      mockAllowBtn = mockButton('consent-allow-all')
      mockSaveBtn = mockButton('consent-save-preferences')

      // Add elements to the document
      document.body.appendChild(mockModal)
      document.body.appendChild(mockCloseBtn)
      document.body.appendChild(mockAllowBtn)
      document.body.appendChild(mockSaveBtn)

      // Create web component instance
      element = new ConsentPreferencesElement()
      document.body.appendChild(element)
    })

    afterEach(() => {
      // Cleanup
      if (mockModal.parentNode) document.body.removeChild(mockModal)
      if (mockCloseBtn.parentNode) document.body.removeChild(mockCloseBtn)
      if (mockAllowBtn.parentNode) document.body.removeChild(mockAllowBtn)
      if (mockSaveBtn.parentNode) document.body.removeChild(mockSaveBtn)
      if (element.parentNode) document.body.removeChild(element)
    })

    describe('Modal Operations', () => {
      it('should show modal when showModal is called', () => {
        element.showModal()
        expect(element['modal']?.style.display).toBe('flex')
      })

      it('should hide modal when close button is clicked', () => {
        // First show the modal
        element.showModal()
        expect(element['modal']?.style.display).toBe('flex')

        // Click close button
        mockCloseBtn.click()

        // Modal should be hidden
        expect(element['modal']?.style.display).toBe('none')
      })
    })

    describe('Consent Management', () => {
      it('should handle allow all button click', () => {
        const mockDataSubjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' // Valid UUID format
        vi.mocked($consent.get).mockReturnValue({
          analytics: false,
          functional: false,
          marketing: false,
          DataSubjectId: mockDataSubjectId,
        })

        // Click allow all button
        mockAllowBtn.click()

        // Verify: allowAllConsent action called
        expect(allowAllConsent).toHaveBeenCalled()
      })

      it('should handle save preferences button click', () => {
        // Set up checkbox elements that the component will find
        const analyticsCheckbox = mockCheckbox('analytics-cookies')
        analyticsCheckbox.checked = true
        const functionalCheckbox = mockCheckbox('functional-cookies')
        functionalCheckbox.checked = false
        const marketingCheckbox = mockCheckbox('marketing-cookies')
        marketingCheckbox.checked = true

        document.body.appendChild(analyticsCheckbox)
        document.body.appendChild(functionalCheckbox)
        document.body.appendChild(marketingCheckbox)

        const mockDataSubjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' // Valid UUID format
        vi.mocked($consent.get).mockReturnValue({
          analytics: false,
          functional: false,
          marketing: false,
          DataSubjectId: mockDataSubjectId,
        })

        // Click save preferences button
        mockSaveBtn.click()

        // Verify: updateConsent called with checkbox states
        expect(updateConsent).toHaveBeenCalledWith('analytics', true)
        expect(updateConsent).toHaveBeenCalledWith('functional', false)
        expect(updateConsent).toHaveBeenCalledWith('marketing', true)

        // Cleanup
        document.body.removeChild(analyticsCheckbox)
        document.body.removeChild(functionalCheckbox)
        document.body.removeChild(marketingCheckbox)
      })
    })
  })
})
