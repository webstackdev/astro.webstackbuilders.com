// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
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
import type { FieldElements } from '@components/Forms/Contact/client/@types'

const createFieldElements = (): FieldElements<HTMLInputElement> => {
  const input = document.createElement('input')
  input.type = 'email'
  input.id = 'email'
  input.required = true
  input.minLength = 5
  input.maxLength = 100

  const label = document.createElement('label')
  label.htmlFor = 'email'

  const feedback = document.createElement('p')
  feedback.dataset.fieldError = 'email'
  feedback.classList.add('hidden')

  return { input, label, feedback }
}

const createGenericForm = () => {
  const form = document.createElement('form')
  const field = document.createElement('input')
  field.id = 'company'
  field.setAttribute('required', 'true')
  form.append(field)
  document.body.append(form)
  return { form, field }
}

describe('Validation helpers', () => {
  describe('Email validation', () => {
    let field: FieldElements<HTMLInputElement>

    beforeEach(() => {
      document.body.innerHTML = ''
      field = createFieldElements()
      document.body.append(field.input, field.label, field.feedback)
    })

    it('attaches handlers via initEmailValidationHandler', () => {
      const addEventListenerSpy = vi.spyOn(field.input, 'addEventListener')

      initEmailValidationHandler(field)

      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function))
    })

    it('shows missing email feedback', () => {
      field.input.value = ''

      const result = validateEmailField(field)

      expect(result).toBe(false)
      expect(field.feedback.classList.contains('hidden')).toBe(false)
      expect(field.feedback.textContent).toContain('Please enter an email address')
    })

    it('rejects invalid email format', () => {
      field.input.value = 'invalid-email'

      const result = validateEmailField(field)

      expect(result).toBe(false)
      expect(field.feedback.textContent).toContain('email address')
    })

    it('rejects values below min length', () => {
      field.input.value = 'a@b'

      const result = validateEmailField(field)

      expect(result).toBe(false)
      expect(field.feedback.textContent).toContain('at least')
    })

    it('rejects values above max length', () => {
      field.input.value = `${'a'.repeat(150)}@example.com`

      const result = validateEmailField(field)

      expect(result).toBe(false)
      expect(field.feedback.textContent).toContain('less than')
    })

    it('clears feedback when email becomes valid', () => {
      field.feedback.classList.remove('hidden')
      field.feedback.textContent = 'Some error'
      field.input.value = 'test@example.com'

      const result = validateEmailField(field)

      expect(result).toBe(true)
      expect(field.feedback.textContent).toBe('')
      expect(field.feedback.classList.contains('hidden')).toBe(true)
    })
  })

  describe('Name validation', () => {
    let field: FieldElements<HTMLInputElement>

    beforeEach(() => {
      document.body.innerHTML = ''
      field = {
        input: Object.assign(document.createElement('input'), {
          id: 'name',
          maxLength: 50,
          required: true,
        }),
        label: document.createElement('label'),
        feedback: document.createElement('p'),
      }
      document.body.append(field.input, field.label, field.feedback)
    })

    it('validates max length and blanks', () => {
      field.input.value = 'a'.repeat(60)
      expect(validateNameField(field)).toBe(false)

      field.input.value = ''
      expect(validateNameField(field)).toBe(false)

      field.input.value = 'Valid Name'
      expect(validateNameField(field)).toBe(true)
    })

    it('hooks input + blur events', () => {
      const spy = vi.spyOn(field.input, 'addEventListener')
      initNameLengthHandler(field)
      expect(spy).toHaveBeenCalledWith('input', expect.any(Function))
      expect(spy).toHaveBeenCalledWith('blur', expect.any(Function))
    })
  })

  describe('Message validation', () => {
    let field: FieldElements<HTMLTextAreaElement>

    beforeEach(() => {
      document.body.innerHTML = ''
      field = {
        input: Object.assign(document.createElement('textarea'), {
          id: 'message',
          maxLength: 2000,
          required: true,
        }),
        label: document.createElement('label'),
        feedback: document.createElement('p'),
      }
      document.body.append(field.input, field.label, field.feedback)
    })

    it('validates blank, warning, and error states', () => {
      field.input.value = ''
      expect(validateMessageField(field)).toBe(false)

      field.input.value = 'a'.repeat(1950)
      expect(validateMessageField(field)).toBe(true)
      expect(field.feedback.dataset['state']).toBe('warning')

      field.input.value = 'a'.repeat(2000)
      expect(validateMessageField(field)).toBe(false)
      expect(field.feedback.dataset['state']).toBe('error')
    })

    it('hooks input + blur events', () => {
      const spy = vi.spyOn(field.input, 'addEventListener')
      initMssgLengthHandler(field)
      expect(spy).toHaveBeenCalledWith('input', expect.any(Function))
      expect(spy).toHaveBeenCalledWith('blur', expect.any(Function))
    })
  })

  describe('Generic validation', () => {
    it('applies required error styling', () => {
      const { form, field } = createGenericForm()
      expect(validateGenericField(field)).toBe(false)
      field.value = 'ACME'
      expect(validateGenericField(field)).toBe(true)
      document.body.removeChild(form)
    })

    it('validates all generic fields in a form', () => {
      const { form, field } = createGenericForm()
      const optional = document.createElement('input')
      optional.id = 'website'
      form.append(optional)

      expect(validateGenericFields(form)).toBe(false)
      field.value = 'Company'
      expect(validateGenericFields(form)).toBe(true)
      document.body.removeChild(form)
    })
  })
})
