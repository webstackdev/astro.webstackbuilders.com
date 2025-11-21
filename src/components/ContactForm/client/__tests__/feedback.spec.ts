// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  clearFieldFeedback,
  hideErrorBanner,
  initLabelHandlers,
  showErrorBanner,
  showFieldFeedback,
} from '@components/ContactForm/client/feedback'
import type { ContactFormFields, FieldElements } from '@components/ContactForm/client/@types'

const createField = <T extends HTMLInputElement | HTMLTextAreaElement>(
  input: T,
  id: string,
): FieldElements<T> => {
  const label = document.createElement('label')
  label.htmlFor = id
  const feedback = document.createElement('p')
  feedback.dataset['fieldError'] = id
  feedback.classList.add('hidden')
  return { input, label, feedback }
}

const createFields = (): ContactFormFields => {
  const nameInput = Object.assign(document.createElement('input'), {
    id: 'name',
    value: '',
  })
  const emailInput = Object.assign(document.createElement('input'), {
    id: 'email',
    type: 'email',
    value: '',
  })
  const messageInput = Object.assign(document.createElement('textarea'), {
    id: 'message',
    value: '',
  })

  return {
    name: createField(nameInput, 'name'),
    email: createField(emailInput, 'email'),
    message: createField(messageInput, 'message'),
  }
}

describe('ContactForm feedback helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('toggles error banner visibility', () => {
    const banner = document.createElement('div')
    banner.classList.add('hidden')

    showErrorBanner(banner)
    expect(banner.classList.contains('hidden')).toBe(false)

    hideErrorBanner(banner)
    expect(banner.classList.contains('hidden')).toBe(true)
  })

  it('shows and clears error feedback for a field', () => {
    const field = createField(Object.assign(document.createElement('input'), { id: 'email' }), 'email')
    field.feedback.style.color = ''

    showFieldFeedback(field, 'Invalid email', 'error')
    expect(field.feedback.textContent).toBe('Invalid email')
    expect(field.feedback.classList.contains('hidden')).toBe(false)
    expect(field.feedback.dataset['state']).toBe('error')
    expect(field.feedback.style.color).toBe('var(--color-danger)')
    expect(field.input.classList.contains('error')).toBe(true)

    clearFieldFeedback(field)
    expect(field.feedback.textContent).toBe('')
    expect(field.feedback.classList.contains('hidden')).toBe(true)
    expect(field.feedback.dataset['state']).toBeUndefined()
    expect(field.feedback.getAttribute('style')).toBeNull()
    expect(field.input.classList.contains('error')).toBe(false)
  })

  it('supports warning-level feedback without marking the field as error', () => {
    const field = createField(Object.assign(document.createElement('textarea'), { id: 'message' }), 'message')

    showFieldFeedback(field, 'Almost too long', 'warning')

    expect(field.feedback.dataset['state']).toBe('warning')
    expect(field.feedback.style.color).toBe('var(--color-warning)')
    expect(field.input.classList.contains('error')).toBe(false)
  })

  it('initializes label handlers and syncs opacity based on field values', () => {
    const fields = createFields()
    const controller = initLabelHandlers(fields)

    expect(fields.name.label.style.opacity).toBe('0.5')

    fields.name.input.value = 'Webstack'
    fields.name.input.dispatchEvent(new Event('input'))
    expect(fields.name.label.style.opacity).toBe('0')

    fields.name.input.value = ''
    controller.sync()
    expect(fields.name.label.style.opacity).toBe('0.5')
  })
})
