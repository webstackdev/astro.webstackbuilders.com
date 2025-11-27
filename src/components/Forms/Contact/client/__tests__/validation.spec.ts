// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { TestError } from '@test/errors'
import {
  initEmailValidationHandler,
  initMssgLengthHandler,
  initNameLengthHandler,
  validateEmailField,
  validateGenericField,
  validateGenericFields,
  validateMessageField,
  validateNameField,
} from '@components/Forms/Contact/client/validation'
import { renderContactForm } from './testUtils'

describe('Validation helpers', () => {
  describe('Email validation', () => {
    it('attaches handlers via initEmailValidationHandler', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.email
        const addEventListenerSpy = vi.spyOn(field.input, 'addEventListener')

        initEmailValidationHandler(field)

        expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
        expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function))
      })
    })

    it('shows missing email feedback', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.email
        field.input.value = ''

        const result = validateEmailField(field)

        expect(result).toBe(false)
        expect(field.feedback.classList.contains('hidden')).toBe(false)
        expect(field.feedback.textContent).toContain('Please enter an email address')
      })
    })

    it('rejects invalid email format', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.email
        field.input.value = 'invalid-email'

        const result = validateEmailField(field)

        expect(result).toBe(false)
        expect(field.feedback.textContent).toContain('email address')
      })
    })

    it('rejects values below min length', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.email
        field.input.setAttribute('minlength', '5')
        field.input.minLength = 5
        field.input.value = 'a@b'

        const result = validateEmailField(field)

        expect(result).toBe(false)
        expect(field.feedback.textContent).toContain('at least')
      })
    })

    it('rejects values above max length', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.email
        field.input.setAttribute('maxlength', '100')
        field.input.maxLength = 100
        field.input.value = `${'a'.repeat(150)}@example.com`

        const result = validateEmailField(field)

        expect(result).toBe(false)
        expect(field.feedback.textContent).toContain('less than')
      })
    })

    it('clears feedback when email becomes valid', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.email
        field.feedback.classList.remove('hidden')
        field.feedback.textContent = 'Some error'
        field.input.value = 'test@example.com'

        const result = validateEmailField(field)

        expect(result).toBe(true)
        expect(field.feedback.textContent).toBe('')
        expect(field.feedback.classList.contains('hidden')).toBe(true)
      })
    })
  })

  describe('Name validation', () => {
    it('validates max length and blanks', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.name

        field.input.value = 'a'.repeat(120)
        expect(validateNameField(field)).toBe(false)

        field.input.value = ''
        expect(validateNameField(field)).toBe(false)

        field.input.value = 'Valid Name'
        expect(validateNameField(field)).toBe(true)
      })
    })

    it('hooks input + blur events', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.name
        const spy = vi.spyOn(field.input, 'addEventListener')

        initNameLengthHandler(field)

        expect(spy).toHaveBeenCalledWith('input', expect.any(Function))
        expect(spy).toHaveBeenCalledWith('blur', expect.any(Function))
      })
    })
  })

  describe('Message validation', () => {
    it('validates blank, warning, and error states', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.message

        field.input.value = ''
        expect(validateMessageField(field)).toBe(false)

        field.input.value = 'a'.repeat(1950)
        expect(validateMessageField(field)).toBe(true)
        expect(field.feedback.dataset['state']).toBe('warning')

        field.input.value = 'a'.repeat(2000)
        expect(validateMessageField(field)).toBe(false)
        expect(field.feedback.dataset['state']).toBe('error')
      })
    })

    it('hooks input + blur events', async () => {
      await renderContactForm(({ elements }) => {
        const field = elements.fields.message
        const spy = vi.spyOn(field.input, 'addEventListener')

        initMssgLengthHandler(field)

        expect(spy).toHaveBeenCalledWith('input', expect.any(Function))
        expect(spy).toHaveBeenCalledWith('blur', expect.any(Function))
      })
    })
  })

  describe('Generic validation', () => {
    it('applies required error styling', async () => {
      await renderContactForm(({ window }) => {
        const field = window.document.getElementById('company') as HTMLInputElement
        field.setAttribute('required', 'true')
        field.value = ''

        expect(validateGenericField(field)).toBe(false)

        field.value = 'ACME'
        expect(validateGenericField(field)).toBe(true)
      })
    })

    it('validates all generic fields in a form', async () => {
      await renderContactForm(({ elements }) => {
        const form = elements.form
        const company = form.querySelector<HTMLInputElement>('#company')
        const budget = form.querySelector<HTMLSelectElement>('#budget')

        expect(validateGenericFields(form)).toBe(false)

        if (!company || !budget) {
          throw new TestError('Company field not found in contact form')
        }

        company.value = 'Webstack Builders'
        company.setAttribute('required', 'true')
        budget.value = '5k-10k'

        expect(validateGenericFields(form)).toBe(true)
      })
    })
  })
})
