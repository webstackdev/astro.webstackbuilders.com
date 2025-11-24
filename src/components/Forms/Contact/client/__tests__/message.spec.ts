// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { initMssgLengthHandler, validateMessageField } from '@components/Forms/Contact/client/validation'
import { renderContactForm } from './testUtils'

describe('Message Validation', () => {
  it('attaches handlers via initMssgLengthHandler', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.message
      const spy = vi.spyOn(field.input, 'addEventListener')

      initMssgLengthHandler(field)

      expect(spy).toHaveBeenCalledWith('input', expect.any(Function))
      expect(spy).toHaveBeenCalledWith('blur', expect.any(Function))
    })
  })

  it('rejects empty messages', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.message
      field.input.value = ''

      const result = validateMessageField(field)

      expect(result).toBe(false)
      expect(field.feedback.textContent).toContain('describe your project')
      expect(field.feedback.dataset['state']).toBe('error')
    })
  })

  it('flags long messages as error', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.message
      field.input.value = 'a'.repeat(2000)

      const result = validateMessageField(field)

      expect(result).toBe(false)
      expect(field.feedback.dataset['state']).toBe('error')
      expect(field.feedback.textContent).toContain('2K characters')
    })
  })

  it('shows warning before hitting max length', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.message
      field.input.value = 'a'.repeat(1900)

      const result = validateMessageField(field)

      expect(result).toBe(true)
      expect(field.feedback.dataset['state']).toBe('warning')
      expect(field.feedback.textContent).toContain('close to the max length')
    })
  })

  it('clears feedback for valid length', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.message
      field.input.value = 'Tell me more about your needs.'

      const result = validateMessageField(field)

      expect(result).toBe(true)
      expect(field.feedback.classList.contains('hidden')).toBe(true)
      expect(field.feedback.textContent).toBe('')
    })
  })
})
