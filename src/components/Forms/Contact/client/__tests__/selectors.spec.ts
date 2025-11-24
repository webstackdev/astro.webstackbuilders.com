// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getContactFormElements } from '@components/Forms/Contact/client/selectors'
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

      expect(elements.formErrorBanner.id).toBe('formErrorBanner')
      expect(elements.successMessage.classList.contains('message-success')).toBe(true)
      expect(elements.errorMessage.classList.contains('message-error')).toBe(true)
      expect(elements.charCount.id).toBe('charCount')
      expect(elements.submitBtn.id).toBe('submitBtn')
      expect(elements.btnText.classList.contains('btn-text')).toBe(true)
      expect(elements.btnLoading.classList.contains('btn-loading')).toBe(true)
    })
  })
})
