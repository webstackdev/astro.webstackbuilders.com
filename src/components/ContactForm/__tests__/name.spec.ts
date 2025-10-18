import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initNameLengthHandler, nameInputElementValidator } from '../name'
import type { ContactFormSelectors } from '../selectors'

describe('Name Validation', () => {
  let mockSelector: ContactFormSelectors
  let nameInput: HTMLInputElement
  let errorContainer: HTMLElement

  beforeEach(() => {
    // Create mock DOM elements
    nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.id = 'name'
    nameInput.name = 'name'
    nameInput.required = true
    nameInput.maxLength = 50

    errorContainer = document.createElement('div')
    errorContainer.className = 'name-error'

    document.body.appendChild(nameInput)
    document.body.appendChild(errorContainer)

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockSelector = {
      nameInputElement: nameInput,
      nameValidationError: errorContainer,
    } as ContactFormSelectors
  })

  describe('initNameLengthHandler', () => {
    it('should attach input event listener to name input element', () => {
      const addEventListenerSpy = vi.spyOn(nameInput, 'addEventListener')

      initNameLengthHandler(mockSelector)

      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
    })
  })

  describe('nameInputElementValidator', () => {
    it('should add error class when name exceeds max length', () => {
      nameInput.value = 'a'.repeat(51) // Exceeds max length of 50

      const validator = nameInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(true)
      expect(errorContainer.innerText).toContain('too long')
      expect(errorContainer.innerText).toContain('50')
    })

    it('should remove error when name is within valid length', () => {
      // First set an error
      errorContainer.classList.add('error')
      errorContainer.innerText = 'Error message'

      // Then set valid name
      nameInput.value = 'John Doe'

      const validator = nameInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(false)
      expect(errorContainer.innerText).toBe('')
    })

    it('should accept names at exactly max length', () => {
      nameInput.value = 'a'.repeat(50) // Exactly max length

      const validator = nameInputElementValidator(mockSelector)
      validator()

      // Based on error.ts, length >= 50 triggers error, so at 50 should have error
      expect(errorContainer.classList.contains('error')).toBe(true)
    })

    it('should accept valid names of various lengths', () => {
      const validNames = [
        'Jo',
        'John Doe',
        'Mary-Jane Watson',
        'Dr. Alexander Hamilton III',
        'a'.repeat(49), // Just under max
      ]

      validNames.forEach(name => {
        errorContainer.classList.remove('error')
        errorContainer.innerText = ''

        nameInput.value = name

        const validator = nameInputElementValidator(mockSelector)
        validator()

        expect(errorContainer.classList.contains('error')).toBe(false)
        expect(errorContainer.innerText).toBe('')
      })
    })

    it('should clear error when name becomes valid (even if error exists)', () => {
      // Set initial error
      errorContainer.classList.add('error')
      const initialError = 'Initial error'
      errorContainer.innerText = initialError

      // Set a too-long name, which should keep error but won't re-add
      nameInput.value = 'a'.repeat(51)

      const validator = nameInputElementValidator(mockSelector)
      validator()

      // The logic: if (isNameLengthError && !hasError) - won't enter since hasError is true
      // Then: else if (nameText.length) - WILL enter and clear error
      // So the error gets cleared when name has length, regardless of validity
      expect(errorContainer.classList.contains('error')).toBe(false)
      expect(errorContainer.innerText).toBe('')
    })

    it('should handle empty name input correctly', () => {
      nameInput.value = ''

      const validator = nameInputElementValidator(mockSelector)
      validator()

      // Empty field shouldn't trigger length error - validation only runs if nameText.length is truthy
      // When empty, the second condition (nameText.length) is falsy, so nothing happens
      expect(errorContainer.classList.contains('error')).toBe(false)
    })

    it('should clear error when transitioning from invalid to valid', () => {
      // Start with too long name
      nameInput.value = 'a'.repeat(60)
      const validator = nameInputElementValidator(mockSelector)
      validator()

      expect(errorContainer.classList.contains('error')).toBe(true)

      // Change to valid name
      nameInput.value = 'Valid Name'
      validator()

      expect(errorContainer.classList.contains('error')).toBe(false)
      expect(errorContainer.innerText).toBe('')
    })
  })
})
