import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RenderContactFormContext } from './testUtils'
import {
  appendUploadFiles,
  applyContactPreviewState,
  resolveContactPreviewState,
} from '@components/Pages/Contact/client/formSubmission'

const contactSubmitMock = vi.hoisted(() => vi.fn())
const isInputErrorMock = vi.hoisted(() => vi.fn())

vi.mock('astro:actions', () => ({
  actions: {
    contact: {
      submit: contactSubmitMock,
    },
  },
  isInputError: isInputErrorMock,
}))

vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: vi.fn(),
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

let renderContactForm: typeof import('./testUtils').renderContactForm

beforeAll(async () => {
  ;({ renderContactForm } = await import('./testUtils'))
})

describe('ContactForm submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    contactSubmitMock.mockReset()
    isInputErrorMock.mockReset()
  })

  it('appends uploaded files to FormData as file1..file5', async () => {
    await renderContactForm(async ({ window }) => {
      const formData = new window.FormData()
      const files = [
        new window.File(['one'], 'one.txt', { type: 'text/plain' }),
        new window.File(['two'], 'two.txt', { type: 'text/plain' }),
      ]

      appendUploadFiles(formData, {
        getFiles: () => files,
        reset: () => undefined,
        destroy: () => undefined,
      })

      expect(formData.get('file1')).toBeInstanceOf(window.File)
      expect(formData.get('file2')).toBeInstanceOf(window.File)
      expect((formData.get('file1') as File).name).toBe('one.txt')
      expect((formData.get('file2') as File).name).toBe('two.txt')
    })
  })

  it('resolves supported contact preview states from query params', () => {
    expect(resolveContactPreviewState('?contactState=success')).toBe('success')
    expect(resolveContactPreviewState('?contactState=error')).toBe('error')
    expect(resolveContactPreviewState('?contactState=loading')).toBe('loading')
    expect(resolveContactPreviewState('?contactState=validation')).toBe('validation')
    expect(resolveContactPreviewState('?contactState=unknown')).toBeNull()
    expect(resolveContactPreviewState('')).toBeNull()
  })

  const fillValidFields = (context: RenderContactFormContext): void => {
    const { elements, window } = context
    elements.fields.name.input.value = 'Webstack Builders'
    elements.fields.email.input.value = 'team@webstackbuilders.com'
    elements.fields.message.input.value = 'Excited to talk about a new project.'
    elements.fields.message.input.dispatchEvent(new window.Event('input', { bubbles: true }))
  }

  it('shows error banner and skips request when validations fail', async () => {
    await renderContactForm(async ({ elements, window }) => {
      const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true })
      elements.form.dispatchEvent(submitEvent)

      await flushPromises()

      expect(contactSubmitMock).not.toHaveBeenCalled()
      expect(elements.formErrorBanner.classList.contains('hidden')).toBe(false)
    })
  })

  it('applies success preview state for styling', async () => {
    await renderContactForm(async context => {
      applyContactPreviewState(context.elements, {
        state: 'success',
        rootElement: context.element,
      })

      expect(context.element.getAttribute('data-contact-state')).toBe('success')
      expect(context.elements.messages.style.display).toBe('block')
      expect(context.elements.successMessage.classList.contains('hidden')).toBe(false)
      expect(context.elements.errorMessage.classList.contains('hidden')).toBe(true)
      expect(context.elements.submitBtn.disabled).toBe(false)
    })
  })

  it('applies error preview state for styling', async () => {
    await renderContactForm(async context => {
      applyContactPreviewState(context.elements, {
        state: 'error',
        rootElement: context.element,
      })

      expect(context.element.getAttribute('data-contact-state')).toBe('error')
      expect(context.elements.messages.style.display).toBe('block')
      expect(context.elements.errorMessage.classList.contains('hidden')).toBe(false)
      expect(context.elements.errorText.textContent).toContain('Unable to send message')
      expect(context.elements.successMessage.classList.contains('hidden')).toBe(true)
    })
  })

  it('applies loading preview state for styling', async () => {
    await renderContactForm(async context => {
      applyContactPreviewState(context.elements, {
        state: 'loading',
        rootElement: context.element,
      })

      expect(context.element.getAttribute('data-contact-state')).toBe('loading')
      expect(context.elements.submitBtn.disabled).toBe(true)
      expect(context.elements.btnText.style.display).toBe('none')
      expect(context.elements.btnLoading.classList.contains('hidden')).toBe(false)
      expect(context.elements.messages.style.display).toBe('none')
    })
  })

  it('applies validation preview state for styling', async () => {
    await renderContactForm(async context => {
      applyContactPreviewState(context.elements, {
        state: 'validation',
        rootElement: context.element,
      })

      expect(context.element.getAttribute('data-contact-state')).toBe('validation')
      expect(context.elements.formErrorBanner.classList.contains('hidden')).toBe(false)
      expect(context.elements.messages.style.display).toBe('block')
      expect(context.elements.errorMessage.classList.contains('hidden')).toBe(false)
      expect(context.elements.errorText.textContent).toBe(
        'Please correct the highlighted fields and try again.'
      )
      expect(context.elements.fields.name.feedback.textContent).toBe('Please enter your name')
      expect(context.elements.fields.email.feedback.textContent).toBe(
        'Please enter a valid email address.'
      )
      expect(context.elements.fields.message.feedback.textContent).toBe('Please describe your project')
    })
  })

  it('submits successfully and resets UI state', async () => {
    await renderContactForm(async context => {
      fillValidFields(context)

      contactSubmitMock.mockResolvedValue({
        data: {
          success: true,
          message: 'Thank you for your message. We will get back to you soon!',
        },
      })

      let confettiEvent: Event | undefined
      context.elements.submitBtn.addEventListener('confetti:fire', event => {
        confettiEvent = event
      })

      const submitEvent = new context.window.Event('submit', { bubbles: true, cancelable: true })
      context.elements.form.dispatchEvent(submitEvent)

      await flushPromises()

      expect(contactSubmitMock).toHaveBeenCalledTimes(1)
      expect(contactSubmitMock.mock.calls[0]?.[0]).toBeInstanceOf(FormData)
      expect(context.elements.messages.style.display).toBe('block')
      expect(context.elements.successMessage.classList.contains('hidden')).toBe(false)
      expect(context.elements.errorMessage.classList.contains('hidden')).toBe(true)
      expect(context.elements.formErrorBanner.classList.contains('hidden')).toBe(true)
      expect(context.elements.submitBtn.disabled).toBe(false)
      expect(context.elements.btnText.style.display).toBe('inline')
      expect(context.elements.btnLoading.classList.contains('hidden')).toBe(true)
      expect(context.elements.charCount.textContent).toBe('0')
      expect(context.elements.charCount.getAttribute('style')).toBeNull()
      expect(context.elements.fields.name.input.value).toBe('')
      expect(context.elements.fields.email.input.value).toBe('')

      expect(confettiEvent).toBeDefined()
      expect(confettiEvent?.target).toBe(context.elements.submitBtn)
      expect(confettiEvent?.bubbles).toBe(true)
      expect((confettiEvent as CustomEvent)?.composed).toBe(true)
    })
  })

  it('displays error message when server rejects submission', async () => {
    await renderContactForm(async context => {
      fillValidFields(context)
      context.elements.charCount.textContent = '42'

      isInputErrorMock.mockReturnValue(false)
      contactSubmitMock.mockResolvedValue({ error: { message: 'Server error' } })

      const submitEvent = new context.window.Event('submit', { bubbles: true, cancelable: true })
      context.elements.form.dispatchEvent(submitEvent)

      await flushPromises()

      expect(contactSubmitMock).toHaveBeenCalled()
      expect(context.elements.messages.style.display).toBe('block')
      expect(context.elements.errorMessage.classList.contains('hidden')).toBe(false)
      expect(context.elements.errorMessage.style.display).toBe('block')
      expect(context.elements.errorText.textContent).toBe('Server error')
      expect(context.elements.successMessage.classList.contains('hidden')).toBe(true)
      expect(context.elements.charCount.textContent).toBe('42')
      expect(context.elements.submitBtn.disabled).toBe(false)
    })
  })

  it('displays field errors when Astro action returns input errors', async () => {
    await renderContactForm(async context => {
      fillValidFields(context)

      const inputError = {
        fields: {
          email: ['Enter a valid email address.'],
        },
      }

      isInputErrorMock.mockImplementation((error: unknown) => {
        return typeof error === 'object' && error !== null && 'fields' in error
      })

      contactSubmitMock.mockResolvedValue({ error: inputError })

      const submitEvent = new context.window.Event('submit', { bubbles: true, cancelable: true })
      context.elements.form.dispatchEvent(submitEvent)

      await flushPromises()

      expect(contactSubmitMock).toHaveBeenCalled()
      expect(context.elements.formErrorBanner.classList.contains('hidden')).toBe(false)
      expect(context.elements.messages.style.display).toBe('block')
      expect(context.elements.errorMessage.classList.contains('hidden')).toBe(false)
      expect(context.elements.errorText.textContent).toBe(
        'Please correct the highlighted fields and try again.'
      )

      expect(context.elements.fields.email.feedback.classList.contains('hidden')).toBe(false)
      expect(context.elements.fields.email.feedback.textContent).toBe('Enter a valid email address.')
      expect(context.elements.fields.email.input.getAttribute('aria-invalid')).toBe('true')
      expect(context.elements.fields.email.input.classList.contains('error')).toBe(true)
    })
  })
})
