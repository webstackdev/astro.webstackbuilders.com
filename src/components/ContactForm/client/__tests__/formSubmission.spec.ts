// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initFormSubmission } from '@components/ContactForm/client/formSubmission'
import type {
  ContactFormConfig,
  ContactFormElements,
  FieldElements,
} from '@components/ContactForm/client/@types'

vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: vi.fn(),
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

const config: ContactFormConfig = {
  maxCharacters: 2000,
  warningThreshold: 1500,
  errorThreshold: 1800,
  apiEndpoint: '/api/contact',
}

const createInputField = (id: string, type: 'text' | 'email' = 'text'): FieldElements<HTMLInputElement> => {
  const input = document.createElement('input')
  input.id = id
  input.name = id
  input.type = type
  input.required = true
  if (id === 'name') {
    input.maxLength = 50
  }
  const label = document.createElement('label')
  label.htmlFor = id
  const feedback = document.createElement('p')
  feedback.dataset['fieldError'] = id
  feedback.classList.add('hidden')
  return { input, label, feedback }
}

const createMessageField = (): FieldElements<HTMLTextAreaElement> => {
  const input = document.createElement('textarea')
  input.id = 'message'
  input.name = 'message'
  input.required = true
  input.maxLength = 2000
  const label = document.createElement('label')
  label.htmlFor = 'message'
  const feedback = document.createElement('p')
  feedback.dataset['fieldError'] = 'message'
  feedback.classList.add('hidden')
  return { input, label, feedback }
}

const buildElements = (): ContactFormElements => {
  const form = document.createElement('form')
  const nameField = createInputField('name')
  nameField.input.value = 'Webstack'
  const emailField = createInputField('email', 'email')
  emailField.input.value = 'team@webstackbuilders.com'
  const messageField = createMessageField()
  messageField.input.value = 'Excited to talk about a new project.'

  form.append(nameField.input, emailField.input, messageField.input)

  const messages = document.createElement('div')
  const successMessage = document.createElement('div')
  successMessage.classList.add('hidden')
  successMessage.classList.add('message-success')
  const errorMessage = document.createElement('div')
  errorMessage.classList.add('hidden')
  errorMessage.classList.add('message-error')
  const errorText = document.createElement('p')
  errorMessage.append(errorText)
  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  const btnText = document.createElement('span')
  btnText.classList.add('btn-text')
  const btnLoading = document.createElement('span')
  btnLoading.classList.add('btn-loading', 'hidden')
  btnLoading.style.display = 'none'
  const charCount = document.createElement('span')
  charCount.id = 'charCount'
  charCount.textContent = '42'
  charCount.style.color = 'var(--color-warning)'
  const uppyContainer = document.createElement('div')
  uppyContainer.id = 'uppyContainer'
  const formErrorBanner = document.createElement('div')
  formErrorBanner.id = 'formErrorBanner'
  formErrorBanner.classList.add('hidden')

  messages.append(successMessage, errorMessage)
  document.body.append(messages, form)

  return {
    form,
    messages,
    successMessage,
    errorMessage,
    errorText,
    submitBtn,
    btnText,
    btnLoading,
    messageTextarea: messageField.input,
    charCount,
    uppyContainer,
    formErrorBanner,
    fields: {
      name: nameField,
      email: emailField,
      message: messageField,
    },
  } as ContactFormElements
}

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

describe('ContactForm submission', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('shows error banner and skips request when validations fail', () => {
    const elements = buildElements()
    elements.fields.name.input.value = ''
    const labelController = { sync: vi.fn() }
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    initFormSubmission(elements, config, { labelController })

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    elements.form.dispatchEvent(submitEvent)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(elements.formErrorBanner.classList.contains('hidden')).toBe(false)
  })

  it('submits successfully and resets UI state', async () => {
    const elements = buildElements()
    const labelController = { sync: vi.fn() }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    initFormSubmission(elements, config, { labelController })

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    elements.form.dispatchEvent(submitEvent)

    await flushPromises()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      config.apiEndpoint,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(elements.messages.style.display).toBe('block')
    expect(elements.successMessage.classList.contains('hidden')).toBe(false)
    expect(elements.errorMessage.classList.contains('hidden')).toBe(true)
    expect(elements.formErrorBanner.classList.contains('hidden')).toBe(true)
    expect(elements.submitBtn.disabled).toBe(false)
    expect(elements.btnText.style.display).toBe('inline')
    expect(elements.btnLoading.classList.contains('hidden')).toBe(true)
    expect(elements.charCount.textContent).toBe('0')
    expect(elements.charCount.getAttribute('style')).toBeNull()
    expect(labelController.sync).toHaveBeenCalledTimes(1)
  })

  it('displays error message when server rejects submission', async () => {
    const elements = buildElements()
    const labelController = { sync: vi.fn() }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, message: 'Server error' }),
    } as Response)

    initFormSubmission(elements, config, { labelController })

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    elements.form.dispatchEvent(submitEvent)

    await flushPromises()

    expect(fetchSpy).toHaveBeenCalled()
    expect(elements.messages.style.display).toBe('block')
    expect(elements.errorMessage.classList.contains('hidden')).toBe(false)
    expect(elements.errorMessage.style.display).toBe('flex')
    expect(elements.errorText.textContent).toBe('Server error')
    expect(elements.successMessage.classList.contains('hidden')).toBe(true)
    expect(labelController.sync).not.toHaveBeenCalled()
    expect(elements.charCount.textContent).toBe('42')
    expect(elements.submitBtn.disabled).toBe(false)
  })
})
