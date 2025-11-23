// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initNameLengthHandler, validateNameField } from '@components/Forms/Contact/client/validation'
import type { FieldElements } from '@components/ContactForm/client/types'

const createFieldElements = (): FieldElements<HTMLInputElement> => {
  const input = document.createElement('input')
  input.type = 'text'
  input.id = 'name'
  input.required = true
  input.maxLength = 50

  const label = document.createElement('label')
  label.htmlFor = 'name'

  const feedback = document.createElement('p')
  feedback.dataset.fieldError = 'name'
  feedback.classList.add('hidden')

  return { input, label, feedback }
}

describe('Name Validation', () => {
  let field: FieldElements<HTMLInputElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    field = createFieldElements()
    document.body.append(field.input, field.label, field.feedback)
  })

  it('attaches handlers via initNameLengthHandler', () => {
    const spy = vi.spyOn(field.input, 'addEventListener')

    initNameLengthHandler(field)

    expect(spy).toHaveBeenCalledWith('input', expect.any(Function))
    expect(spy).toHaveBeenCalledWith('blur', expect.any(Function))
  })

  it('rejects empty names', () => {
    field.input.value = ''

    const result = validateNameField(field)

    expect(result).toBe(false)
    expect(field.feedback.textContent).toContain('enter your name')
  })

  it('rejects names longer than 50 characters', () => {
    field.input.value = 'a'.repeat(60)

    const result = validateNameField(field)

    expect(result).toBe(false)
    expect(field.feedback.textContent).toContain('too long')
  })

  it('accepts valid names', () => {
    field.input.value = 'Jane Doe'

    const result = validateNameField(field)

    expect(result).toBe(true)
    expect(field.feedback.classList.contains('hidden')).toBe(true)
  })
})
