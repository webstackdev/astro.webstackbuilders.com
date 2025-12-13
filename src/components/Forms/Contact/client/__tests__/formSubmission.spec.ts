import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TestError } from '@test/errors'
import { renderContactForm, type RenderContactFormContext } from './testUtils'

vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: vi.fn(),
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

describe('ContactForm submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true })
      elements.form.dispatchEvent(submitEvent)

      await flushPromises()

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(elements.formErrorBanner.classList.contains('hidden')).toBe(false)

      fetchSpy.mockRestore()
    })
  })

  it('submits successfully and resets UI state', async () => {
    await renderContactForm(async context => {
      fillValidFields(context)

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      let confettiEvent: Event | undefined
      context.elements.submitBtn.addEventListener('confetti:fire', (event) => {
        confettiEvent = event
      })

      const submitEvent = new context.window.Event('submit', { bubbles: true, cancelable: true })
      context.elements.form.dispatchEvent(submitEvent)

      await flushPromises()

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/contact',
        expect.objectContaining({ method: 'POST' }),
      )
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

      fetchSpy.mockRestore()
    })
  })

  it('displays error message when server rejects submission', async () => {
    await renderContactForm(async context => {
      fillValidFields(context)
      context.elements.charCount.textContent = '42'

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, message: 'Server error' }),
      } as Response)

      const submitEvent = new context.window.Event('submit', { bubbles: true, cancelable: true })
      context.elements.form.dispatchEvent(submitEvent)

      await flushPromises()

      expect(fetchSpy).toHaveBeenCalled()
      expect(context.elements.messages.style.display).toBe('block')
      expect(context.elements.errorMessage.classList.contains('hidden')).toBe(false)
      expect(context.elements.errorMessage.style.display).toBe('flex')
      expect(context.elements.errorText.textContent).toBe('Server error')
      expect(context.elements.successMessage.classList.contains('hidden')).toBe(true)
      expect(context.elements.charCount.textContent).toBe('42')
      expect(context.elements.submitBtn.disabled).toBe(false)

      fetchSpy.mockRestore()
    })
  })
})
