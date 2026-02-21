import { describe, it, expect } from 'vitest'
import {
  clearFieldFeedback,
  hideErrorBanner,
  initLabelHandlers,
  showErrorBanner,
  showFieldFeedback,
} from '@components/Pages/Contact/client/feedback'
import { renderContactForm } from './testUtils'

describe('ContactForm feedback helpers', () => {
  it('toggles error banner visibility', async () => {
    await renderContactForm(({ elements }) => {
      showErrorBanner(elements.formErrorBanner)
      expect(elements.formErrorBanner.classList.contains('hidden')).toBe(false)

      hideErrorBanner(elements.formErrorBanner)
      expect(elements.formErrorBanner.classList.contains('hidden')).toBe(true)
    })
  })

  it('shows and clears error feedback for a field', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.email

      showFieldFeedback(field, 'Invalid email', 'error')
      expect(field.feedback.textContent).toBe('Invalid email')
      expect(field.feedback.classList.contains('hidden')).toBe(false)
      expect(field.feedback.dataset['state']).toBe('error')
      expect(field.feedback.style.color).toBe('var(--color-danger)')
      expect(field.input.classList.contains('error')).toBe(true)
      expect(field.input.getAttribute('aria-invalid')).toBe('true')

      clearFieldFeedback(field)
      expect(field.feedback.textContent).toBe('')
      expect(field.feedback.classList.contains('hidden')).toBe(true)
      expect(field.feedback.dataset['state']).toBeUndefined()
      expect(field.feedback.getAttribute('style')).toBeNull()
      expect(field.input.classList.contains('error')).toBe(false)
      expect(field.input.getAttribute('aria-invalid')).toBe('false')
    })
  })

  it('supports warning-level feedback without marking the field as error', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.message

      showFieldFeedback(field, 'Almost too long', 'warning')

      expect(field.feedback.dataset['state']).toBe('warning')
      expect(field.feedback.style.color).toBe('var(--color-warning)')
      expect(field.input.classList.contains('error')).toBe(false)
      expect(field.input.getAttribute('aria-invalid')).toBe('false')
    })
  })

  it('initializes label handlers and syncs opacity based on field values', async () => {
    await renderContactForm(({ elements, window }) => {
      const controller = initLabelHandlers(elements.fields)

      expect(elements.fields.name.label.style.opacity).toBe('0.5')

      elements.fields.name.input.value = 'Webstack'
      elements.fields.name.input.dispatchEvent(new window.Event('input'))
      expect(elements.fields.name.label.style.opacity).toBe('0')

      elements.fields.name.input.value = ''
      controller.sync()
      expect(elements.fields.name.label.style.opacity).toBe('0.5')
    })
  })
})
