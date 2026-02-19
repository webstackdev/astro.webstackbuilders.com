import { describe, it, expect } from 'vitest'
import {
  getContactFormElements,
  queryContactFormGenericFields,
} from '@components/Forms/Contact/client/selectors'
import { renderContactForm } from './testUtils'

describe('ContactForm selectors', () => {
  it('collects all required form elements from rendered ContactForm', async () => {
    await renderContactForm(() => {
      const elements = getContactFormElements()

      expect(elements.form.id).toBe('contactForm')
      expect(elements.fields.name.input.id).toBe('name')
      expect(elements.fields.email.input.id).toBe('email')
      expect(elements.fields.message.input.id).toBe('message')
      expect(elements.fields.name.feedback.dataset['fieldError']).toBe('name')
      expect(elements.fields.email.feedback.dataset['fieldError']).toBe('email')
      expect(elements.fields.message.feedback.dataset['fieldError']).toBe('message')

      expect(elements.fields.name.feedback.id).toBe('name-error')
      expect(elements.fields.email.feedback.id).toBe('email-error')
      expect(elements.fields.message.feedback.id).toBe('message-error')

      expect(elements.fields.name.input.getAttribute('aria-errormessage')).toBe('name-error')
      expect(elements.fields.email.input.getAttribute('aria-errormessage')).toBe('email-error')
      expect(elements.fields.message.input.getAttribute('aria-errormessage')).toBe('message-error')

      expect(elements.formErrorBanner.id).toBe('formErrorBanner')
      expect(elements.successMessage.classList.contains('message-success')).toBe(true)
      expect(elements.errorMessage.classList.contains('message-error')).toBe(true)

      expect(elements.successMessage.getAttribute('role')).toBe('status')
      expect(elements.successMessage.getAttribute('aria-live')).toBe('polite')
      expect(elements.errorMessage.getAttribute('role')).toBe('alert')
      expect(elements.errorMessage.getAttribute('aria-live')).toBe('assertive')
      expect(elements.charCount.id).toBe('charCount')
      expect(elements.submitBtn.id).toBe('submitBtn')
      expect(elements.btnText.classList.contains('btn-text')).toBe(true)
      expect(elements.btnLoading.classList.contains('btn-loading')).toBe(true)
    })
  })

  it('exposes generic fields for validation helpers', async () => {
    await renderContactForm(() => {
      const elements = getContactFormElements()
      const genericFields = queryContactFormGenericFields(elements.form)

      expect(
        genericFields.some(field => field.id === 'company'),
        'Generic fields should include #company for generic validation'
      ).toBe(true)

      expect(
        genericFields.some(field => field.id === 'budget'),
        'Generic fields should include required #budget for generic validation'
      ).toBe(true)

      expect(
        genericFields.some(field => field.id === 'name'),
        'Generic fields should still include #name so callers can filter custom fields'
      ).toBe(true)
    })
  })
})
