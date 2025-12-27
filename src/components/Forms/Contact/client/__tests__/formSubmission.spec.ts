import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestError } from '@test/errors'
import type { RenderContactFormContext } from './testUtils'
import { appendUploadFiles } from '@components/Forms/Contact/client/formSubmission'

const contactSubmitMock = vi.hoisted(() => vi.fn())

vi.mock('astro:actions', () => ({
  actions: {
    contact: {
      submit: contactSubmitMock,
    },
  },
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

  const fillValidFields = (context: RenderContactFormContext): void => {
    const { elements, window } = context
    elements.fields.name.input.value = 'Webstack Builders'
    elements.fields.email.input.value = 'team@webstackbuilders.com'
    elements.fields.message.input.value = 'Excited to talk about a new project.'
    elements.fields.message.input.dispatchEvent(new window.Event('input', { bubbles: true }))

    const budgetSelect = window.document.getElementById('budget') as HTMLSelectElement | null
    if (!budgetSelect) {
      throw new TestError('Budget select not found in contact form')
    }
    budgetSelect.value = '5k-10k'
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

  it('submits successfully and resets UI state', async () => {
    await renderContactForm(async context => {
      fillValidFields(context)

      contactSubmitMock.mockResolvedValue({
        data: { success: true, message: 'Thank you for your message. We will get back to you soon!' },
      })

      let confettiEvent: Event | undefined
      context.elements.submitBtn.addEventListener('confetti:fire', (event) => {
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

      contactSubmitMock.mockResolvedValue({ error: { message: 'Server error' } })

      const submitEvent = new context.window.Event('submit', { bubbles: true, cancelable: true })
      context.elements.form.dispatchEvent(submitEvent)

      await flushPromises()

      expect(contactSubmitMock).toHaveBeenCalled()
      expect(context.elements.messages.style.display).toBe('block')
      expect(context.elements.errorMessage.classList.contains('hidden')).toBe(false)
      expect(context.elements.errorMessage.style.display).toBe('flex')
      expect(context.elements.errorText.textContent).toBe('Server error')
      expect(context.elements.successMessage.classList.contains('hidden')).toBe(true)
      expect(context.elements.charCount.textContent).toBe('42')
      expect(context.elements.submitBtn.disabled).toBe(false)
    })
  })
})
