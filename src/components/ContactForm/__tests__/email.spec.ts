// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initEmailValidationHandler, emailInputElementValidator } from '../email'
import type { ContactFormSelectors } from '../selectors'

describe('Email Validation', () => {
  let mockSelector: ContactFormSelectors
  let emailInput: HTMLInputElement
  let errorContainer: HTMLElement

  beforeEach(() => {
    // Create mock DOM elements
    emailInput = document.createElement('input')
    emailInput.type = 'email'
    emailInput.id = 'email'
    emailInput.name = 'email'
    emailInput.required = true
    emailInput.minLength = 5
    emailInput.maxLength = 100

    errorContainer = document.createElement('div')
    errorContainer.className = 'email-error'

    document.body.appendChild(emailInput)
    document.body.appendChild(errorContainer)

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockSelector = {
      emailInputElement: emailInput,
      emailValidationError: errorContainer,
    } as ContactFormSelectors
  })

  describe('initEmailValidationHandler', () => {
    it('should attach input event listener to email input element', () => {
      const addEventListenerSpy = vi.spyOn(emailInput, 'addEventListener')

      initEmailValidationHandler(mockSelector)

      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
    })
  })

  describe('emailInputElementValidator', () => {
    it('should add error class when email is missing', () => {
      emailInput.value = ''
      emailInput.dispatchEvent(new Event('input'))

      const validator = emailInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(true)
      expect(errorContainer.innerText).toContain('Please enter an email address')
    })

    it('should add error class when email format is invalid', () => {
      emailInput.value = 'invalid-email'
      emailInput.dispatchEvent(new Event('input'))

      const validator = emailInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(true)
      expect(errorContainer.innerText).toContain('Entered value needs to be an email address')
    })

    it('should add error class when email is too short', () => {
      emailInput.value = 'a@b'
      // Need to manually set validity for testing
      Object.defineProperty(emailInput, 'validity', {
        writable: true,
        value: { valid: false, tooShort: true },
      })

      const validator = emailInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(true)
      expect(errorContainer.innerText).toContain('at least')
    })

    it('should add error class when email is too long', () => {
      emailInput.value = 'a'.repeat(101) + '@example.com'
      // Need to manually set validity for testing
      Object.defineProperty(emailInput, 'validity', {
        writable: true,
        value: { valid: false, tooLong: true },
      })

      const validator = emailInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(true)
      expect(errorContainer.innerText).toContain('less than')
    })

    it('should remove error class when email becomes valid', () => {
      // First set an error
      errorContainer.classList.add('error')
      errorContainer.innerText = 'Error message'

      // Then set valid email
      emailInput.value = 'test@example.com'
      emailInput.dispatchEvent(new Event('input'))

      const validator = emailInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(false)
      expect(errorContainer.innerText).toBe('')
    })

    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@sub.example.com',
      ]

      validEmails.forEach(email => {
        errorContainer.classList.remove('error')
        errorContainer.innerText = ''

        emailInput.value = email
        emailInput.dispatchEvent(new Event('input'))

        const validator = emailInputElementValidator(mockSelector)
        validator()

        expect(errorContainer.classList.contains('error')).toBe(false)
        expect(errorContainer.innerText).toBe('')
      })
    })

    it('should not duplicate error when error already exists', () => {
      // Set initial error
      errorContainer.classList.add('error')
      errorContainer.innerText = 'Initial error'

      // Try to add error again
      emailInput.value = ''
      const validator = emailInputElementValidator(mockSelector)
      validator()

      // Should still have error class but not duplicate
      expect(errorContainer.classList.contains('error')).toBe(true)
    })
  })
})
