// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initMssgLengthHandler, validateMessageField } from '@components/ContactForm/client/validation'
import type { FieldElements } from '@components/ContactForm/client/types'

const createMessageField = (): FieldElements<HTMLTextAreaElement> => {
  const input = document.createElement('textarea')
  input.id = 'message'
  input.required = true
  input.maxLength = 2000

  const label = document.createElement('label')
  label.htmlFor = 'message'

  const feedback = document.createElement('p')
  feedback.dataset.fieldError = 'message'
  feedback.classList.add('hidden')

  return { input, label, feedback }
}

describe('Message Validation', () => {
  let field: FieldElements<HTMLTextAreaElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    field = createMessageField()
    document.body.append(field.input, field.label, field.feedback)
  })

  it('attaches handlers via initMssgLengthHandler', () => {
    const spy = vi.spyOn(field.input, 'addEventListener')

    initMssgLengthHandler(field)

    expect(spy).toHaveBeenCalledWith('input', expect.any(Function))
    expect(spy).toHaveBeenCalledWith('blur', expect.any(Function))
  })

  it('rejects empty messages', () => {
    field.input.value = ''

    const result = validateMessageField(field)

    expect(result).toBe(false)
    expect(field.feedback.textContent).toContain('describe your project')
    expect(field.feedback.dataset.state).toBe('error')
  })

  it('flags long messages as error', () => {
    field.input.value = 'a'.repeat(2000)

    const result = validateMessageField(field)

    expect(result).toBe(false)
    expect(field.feedback.dataset.state).toBe('error')
    expect(field.feedback.textContent).toContain('2K characters')
  })

  it('shows warning before hitting max length', () => {
    field.input.value = 'a'.repeat(1900)

    const result = validateMessageField(field)

    expect(result).toBe(true)
    expect(field.feedback.dataset.state).toBe('warning')
    expect(field.feedback.textContent).toContain('close to the max length')
  })

  it('clears feedback for valid length', () => {
    field.input.value = 'Tell me more about your needs.'

    const result = validateMessageField(field)

    expect(result).toBe(true)
    expect(field.feedback.classList.contains('hidden')).toBe(true)
    expect(field.feedback.textContent).toBe('')
  })
})
