import { describe, it, expect } from 'vitest'
import {
  isMssgLengthWarning,
  isMssgLengthError,
  mssgLengthWarningText,
  mssgLengthErrorText,
  isNameLengthError,
  nameLengthErrorText,
  missingEmailAddressText,
  invalidEmailAddressText,
  maxLengthEmailAddressText,
  minLengthEmailAddressText,
  getInvalidFormText,
  messageWarnLength,
  messageMaxLength,
  nameMaxLength,
} from '@components/Pages/Contact/client/errorMessages'

describe('Error Messages and Validation', () => {
  describe('Message Length Validation', () => {
    describe('isMssgLengthWarning', () => {
      it('should return true when message is between warning and max length', () => {
        const message = 'a'.repeat(1850) // Between 1800 and 2000
        expect(isMssgLengthWarning(message)).toBe(true)
      })

      it('should return false when message is below warning threshold', () => {
        const message = 'a'.repeat(1000)
        expect(isMssgLengthWarning(message)).toBe(false)
      })

      it('should return false when message is at or above max length', () => {
        const message = 'a'.repeat(2000)
        expect(isMssgLengthWarning(message)).toBe(false)
      })

      it('should return false at warning threshold boundary', () => {
        const message = 'a'.repeat(messageWarnLength)
        expect(isMssgLengthWarning(message)).toBe(false)
      })

      it('should return true just above warning threshold', () => {
        const message = 'a'.repeat(messageWarnLength + 1)
        expect(isMssgLengthWarning(message)).toBe(true)
      })
    })

    describe('isMssgLengthError', () => {
      it('should return true when message is at max length', () => {
        const message = 'a'.repeat(2000)
        expect(isMssgLengthError(message)).toBe(true)
      })

      it('should return true when message exceeds max length', () => {
        const message = 'a'.repeat(2500)
        expect(isMssgLengthError(message)).toBe(true)
      })

      it('should return false when message is below max length', () => {
        const message = 'a'.repeat(1999)
        expect(isMssgLengthError(message)).toBe(false)
      })

      it('should return false for empty message', () => {
        expect(isMssgLengthError('')).toBe(false)
      })
    })

    describe('mssgLengthWarningText', () => {
      it('should return warning text with remaining characters', () => {
        const message = 'a'.repeat(1850)
        const text = mssgLengthWarningText(message)

        expect(text).toContain('close to the max length')
        expect(text).toContain((messageMaxLength - 1850).toString())
      })

      it('should calculate remaining characters correctly', () => {
        const lengths = [1801, 1850, 1900, 1950, 1999]

        lengths.forEach(length => {
          const message = 'a'.repeat(length)
          const text = mssgLengthWarningText(message)
          const remaining = messageMaxLength - length

          expect(text).toContain(remaining.toString())
        })
      })
    })

    describe('mssgLengthErrorText', () => {
      it('should return error text for max length exceeded', () => {
        const text = mssgLengthErrorText()

        expect(text).toContain('2K characters')
        expect(text).toContain('too long')
      })
    })
  })

  describe('Name Length Validation', () => {
    describe('isNameLengthError', () => {
      it('should return true when name is at max length', () => {
        const name = 'a'.repeat(nameMaxLength)
        expect(isNameLengthError(name)).toBe(true)
      })

      it('should return true when name exceeds max length', () => {
        const name = 'a'.repeat(nameMaxLength + 10)
        expect(isNameLengthError(name)).toBe(true)
      })

      it('should return false when name is below max length', () => {
        const name = 'a'.repeat(nameMaxLength - 1)
        expect(isNameLengthError(name)).toBe(false)
      })

      it('should return false for empty name', () => {
        expect(isNameLengthError('')).toBe(false)
      })

      it('should return false for short names', () => {
        const names = ['Jo', 'Jane', 'John Doe']
        names.forEach(name => {
          expect(isNameLengthError(name)).toBe(false)
        })
      })
    })

    describe('nameLengthErrorText', () => {
      it('should return error text with max length', () => {
        const text = nameLengthErrorText()

        expect(text).toContain('too long')
        expect(text).toContain(nameMaxLength.toString())
      })
    })
  })

  describe('Email Validation Messages', () => {
    describe('missingEmailAddressText', () => {
      it('should return message for missing email', () => {
        const text = missingEmailAddressText()

        expect(text).toContain('enter an email')
      })
    })

    describe('invalidEmailAddressText', () => {
      it('should return message for invalid email format', () => {
        const text = invalidEmailAddressText()

        expect(text).toContain('email address')
      })
    })

    describe('maxLengthEmailAddressText', () => {
      it('should return message with max length and actual length', () => {
        const mockInput = {
          maxLength: 100,
          value: 'a'.repeat(110) + '@example.com',
        } satisfies Partial<HTMLInputElement>

        const text = maxLengthEmailAddressText(mockInput as HTMLInputElement)

        expect(text).toContain('100')
        expect(text).toContain(mockInput.value.length.toString())
      })
    })

    describe('minLengthEmailAddressText', () => {
      it('should return message with min length and actual length', () => {
        const mockInput = {
          minLength: 5,
          value: 'a@b',
        } satisfies Partial<HTMLInputElement>

        const text = minLengthEmailAddressText(mockInput as HTMLInputElement)

        expect(text).toContain('5')
        expect(text).toContain('3')
      })
    })
  })

  describe('Form Validation Messages', () => {
    describe('getInvalidFormText', () => {
      it('should return message for invalid form', () => {
        const text = getInvalidFormText()

        expect(text).toContain('fix the errors')
        expect(text).toContain('submit')
      })
    })
  })

  describe('Constants', () => {
    it('should have correct message warning length', () => {
      expect(messageWarnLength).toBe(1800)
    })

    it('should have correct message max length', () => {
      expect(messageMaxLength).toBe(2000)
    })

    it('should have correct name max length', () => {
      expect(nameMaxLength).toBe(50)
    })

    it('should have warning threshold less than max length', () => {
      expect(messageWarnLength).toBeLessThan(messageMaxLength)
    })
  })
})
