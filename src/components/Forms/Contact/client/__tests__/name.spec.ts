import { describe, it, expect, vi } from 'vitest'
import { initNameLengthHandler, validateNameField } from '@components/Forms/Contact/client/validation'
import { renderContactForm } from './testUtils'

describe('Name Validation', () => {
  it('attaches handlers via initNameLengthHandler', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.name
      const spy = vi.spyOn(field.input, 'addEventListener')

      initNameLengthHandler(field)

      expect(spy).toHaveBeenCalledWith('input', expect.any(Function))
      expect(spy).toHaveBeenCalledWith('blur', expect.any(Function))
    })
  })

  it('rejects empty names', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.name
      field.input.value = ''

      const result = validateNameField(field)

      expect(result).toBe(false)
      expect(field.feedback.textContent).toContain('enter your name')
    })
  })

  it('rejects names longer than 50 characters', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.name
      field.input.value = 'a'.repeat(60)

      const result = validateNameField(field)

      expect(result).toBe(false)
      expect(field.feedback.textContent).toContain('too long')
    })
  })

  it('accepts valid names', async () => {
    await renderContactForm(({ elements }) => {
      const field = elements.fields.name
      field.input.value = 'Jane Doe'

      const result = validateNameField(field)

      expect(result).toBe(true)
      expect(field.feedback.classList.contains('hidden')).toBe(true)
    })
  })
})
