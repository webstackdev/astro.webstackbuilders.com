// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initMssgLengthHandler, messageInputElementValidator } from '../message'
import type { ContactFormSelectors } from '../selectors'

describe('Message Validation', () => {
  let mockSelector: ContactFormSelectors
  let messageInput: HTMLTextAreaElement
  let errorContainer: HTMLElement

  beforeEach(() => {
    // Create mock DOM elements
    messageInput = document.createElement('textarea')
    messageInput.id = 'message'
    messageInput.name = 'message'
    messageInput.required = true
    messageInput.maxLength = 2000

    errorContainer = document.createElement('div')
    errorContainer.className = 'message-error'

    document.body.appendChild(messageInput)
    document.body.appendChild(errorContainer)

    mockSelector = {
      messageInputElement: messageInput,
      messageValidationError: errorContainer,
    } as unknown as ContactFormSelectors
  })

  describe('initMssgLengthHandler', () => {
    it('should attach input event listener to message textarea', () => {
      const addEventListenerSpy = vi.spyOn(messageInput, 'addEventListener')

      initMssgLengthHandler(mockSelector)

      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
    })
  })

  describe('messageInputElementValidator', () => {
    it('should add warning class when message length exceeds warning threshold', () => {
      // Warning threshold is 1800 characters
      messageInput.value = 'a'.repeat(1850)

      const validator = messageInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('warning')).toBe(true)
      expect(errorContainer.innerText).toContain('close to the max length')
    })

    it('should add error class when message length reaches max length', () => {
      // Max length is 2000 characters
      messageInput.value = 'a'.repeat(2000)

      const validator = messageInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(true)
      expect(errorContainer.innerText).toContain('limited to 2K characters')
    })

    it('should transition from warning to error when exceeding max length', () => {
      // Start with warning
      messageInput.value = 'a'.repeat(1850)
      const validator = messageInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('warning')).toBe(true)

      // Exceed max length
      messageInput.value = 'a'.repeat(2000)
      validator()

      expect(errorContainer.classList.contains('warning')).toBe(false)
      expect(errorContainer.classList.contains('error')).toBe(true)
    })

    it('should transition from error to warning when reducing length', () => {
      // Start with error
      messageInput.value = 'a'.repeat(2000)
      const validator = messageInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(true)

      // Reduce to warning range
      messageInput.value = 'a'.repeat(1850)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(false)
      expect(errorContainer.classList.contains('warning')).toBe(true)
    })

    it('should clear all states when message is valid length', () => {
      // Set error state
      errorContainer.classList.add('error')
      errorContainer.innerText = 'Error message'

      // Set valid message
      messageInput.value = 'This is a normal message'

      const validator = messageInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(false)
      expect(errorContainer.classList.contains('warning')).toBe(false)
      expect(errorContainer.innerText).toBe('')
    })

    it('should show remaining characters in warning message', () => {
      const length = 1850
      messageInput.value = 'a'.repeat(length)

      const validator = messageInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.innerText).toContain((length - 2000).toString())
    })

    it('should accept messages at various valid lengths', () => {
      const validLengths = [10, 100, 500, 1000, 1500, 1799]

      validLengths.forEach(length => {
        errorContainer.className = 'message-error'
        errorContainer.innerText = ''

        messageInput.value = 'a'.repeat(length)

        const validator = messageInputElementValidator(mockSelector)
        validator()

        expect(errorContainer.classList.contains('error')).toBe(false)
        expect(errorContainer.classList.contains('warning')).toBe(false)
        expect(errorContainer.innerText).toBe('')
      })
    })

    it('should handle boundary conditions correctly', () => {
      const validator = messageInputElementValidator(mockSelector)

      // At warning threshold (1800) - should trigger warning
      messageInput.value = 'a'.repeat(1801)
      validator()
      expect(errorContainer.classList.contains('warning')).toBe(true)

      errorContainer.className = 'message-error'
      errorContainer.innerText = ''

      // Just before warning threshold - should be clear
      messageInput.value = 'a'.repeat(1800)
      validator()
      expect(errorContainer.classList.contains('warning')).toBe(false)
      expect(errorContainer.classList.contains('error')).toBe(false)

      // At max length (2000) - should trigger error
      messageInput.value = 'a'.repeat(2000)
      validator()
      expect(errorContainer.classList.contains('error')).toBe(true)
    })

    it('should clear warning when transitioning (hasWarning prevents re-add)', () => {
      // Set initial warning
      errorContainer.classList.add('warning')
      const initialWarning = 'Initial warning'
      errorContainer.innerText = initialWarning

      // Trigger warning condition again
      messageInput.value = 'a'.repeat(1850)
      const validator = messageInputElementValidator(mockSelector)
      validator()

      // The logic: if (warning condition && !hasWarning) - won't enter
      // Then: else if (mssgText.length) - WILL enter and clear
      expect(errorContainer.classList.contains('warning')).toBe(false)
      expect(errorContainer.innerText).toBe('')
    })

    it('should clear error when transitioning (hasError prevents re-add)', () => {
      // Set initial error
      errorContainer.classList.add('error')
      const initialError = 'Initial error'
      errorContainer.innerText = initialError

      // Trigger error condition again
      messageInput.value = 'a'.repeat(2000)
      const validator = messageInputElementValidator(mockSelector)
      validator()

      // The logic: if (error condition && !hasError) - won't enter
      // Then: else if (mssgText.length) - WILL enter and clear
      expect(errorContainer.classList.contains('error')).toBe(false)
      expect(errorContainer.innerText).toBe('')
    })
  })
})
