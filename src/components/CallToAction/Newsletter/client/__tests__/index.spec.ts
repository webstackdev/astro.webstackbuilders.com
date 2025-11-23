// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { Window } from 'happy-dom'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import NewsletterFixture from '@components/CallToAction/Newsletter/client/__fixtures__/index.fixture.astro'

type NewsletterFormElementInstance = import('@components/CallToAction/Newsletter/client').NewsletterFormElement
type NewsletterClientModule = typeof import('@components/CallToAction/Newsletter/client')

const flushPromises = async () => {
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('NewsletterFormElement web component', () => {
  let container: AstroContainer
  let newsletterElement: NewsletterFormElementInstance
  let windowInstance: Window
  let registerNewsletterFormWebComponent: NewsletterClientModule['registerNewsletterFormWebComponent'] | undefined
  let fetchMock: ReturnType<typeof vi.fn>

  const defineGlobalProperty = (key: string, value: unknown) => {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value,
    })
  }

  const applyWindowGlobals = (win: Window) => {
    defineGlobalProperty('window', win)
    defineGlobalProperty('document', win.document)
    defineGlobalProperty('navigator', win.navigator)
    defineGlobalProperty('CustomEvent', win.CustomEvent)
    defineGlobalProperty('Event', win.Event)
    defineGlobalProperty('KeyboardEvent', win.KeyboardEvent)
    defineGlobalProperty('MouseEvent', win.MouseEvent)
    defineGlobalProperty('Node', win.Node)
    defineGlobalProperty('Element', win.Element)
    defineGlobalProperty('HTMLElement', win.HTMLElement)
    defineGlobalProperty('HTMLFormElement', win.HTMLFormElement)
    defineGlobalProperty('HTMLInputElement', win.HTMLInputElement)
    defineGlobalProperty('HTMLButtonElement', win.HTMLButtonElement)
    defineGlobalProperty('HTMLSpanElement', win.HTMLSpanElement)
    defineGlobalProperty('HTMLParagraphElement', win.HTMLParagraphElement)
    defineGlobalProperty('SVGElement', win.SVGElement)
    defineGlobalProperty('SVGSVGElement', win.SVGSVGElement)
    defineGlobalProperty('customElements', win.customElements)
    defineGlobalProperty('MutationObserver', win.MutationObserver)
    defineGlobalProperty('getComputedStyle', win.getComputedStyle.bind(win))
    defineGlobalProperty('requestAnimationFrame', win.requestAnimationFrame.bind(win))
    defineGlobalProperty('cancelAnimationFrame', win.cancelAnimationFrame.bind(win))
  }

  beforeAll(async () => {
    windowInstance = new Window()
    applyWindowGlobals(windowInstance)
    const clientModule = await import('@components/CallToAction/Newsletter/client')
    registerNewsletterFormWebComponent = clientModule.registerNewsletterFormWebComponent
    if (!registerNewsletterFormWebComponent) {
      throw new Error('registerNewsletterFormWebComponent is unavailable')
    }
  })

  beforeEach(async () => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    container = await AstroContainer.create()
    const html = await container.renderToString(NewsletterFixture)
    const domParser = new windowInstance.DOMParser()
    const doc = domParser.parseFromString(html, 'text/html')

    if (!registerNewsletterFormWebComponent) {
      throw new Error('registerNewsletterFormWebComponent did not initialize')
    }

    registerNewsletterFormWebComponent()
    windowInstance.document.body.innerHTML = doc.body?.innerHTML ?? ''

    const root = windowInstance.document.querySelector('newsletter-form') as NewsletterFormElementInstance | null
    if (!root) {
      throw new Error('Failed to locate <newsletter-form> in rendered fixture')
    }

    newsletterElement = root
    newsletterElement.initialize()
  })

  afterEach(() => {
    windowInstance.document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  afterAll(() => {
    windowInstance.close()
  })

  const selectElement = <T extends Element>(selector: string): T => {
    const element = newsletterElement.querySelector(selector)
    if (!element) {
      throw new Error(`Failed to locate ${selector} within newsletter-form`)
    }
    return element as T
  }

  const getElements = () => ({
    form: selectElement<HTMLFormElement>('#newsletter-form'),
    emailInput: selectElement<HTMLInputElement>('#newsletter-email'),
    consentCheckbox: selectElement<HTMLInputElement>('#newsletter-gdpr-consent'),
    submitButton: selectElement<HTMLButtonElement>('#newsletter-submit'),
    buttonText: selectElement<HTMLSpanElement>('#button-text'),
    buttonArrow: selectElement<SVGSVGElement>('#button-arrow'),
    buttonSpinner: selectElement<SVGSVGElement>('#button-spinner'),
    message: selectElement<HTMLParagraphElement>('#newsletter-message'),
  })

  test('registers the custom element and hydrates DOM references', () => {
    expect(customElements.get('newsletter-form')).toBeDefined()

    const elements = getElements()
    expect(elements.form.id).toBe('newsletter-form')
    expect(elements.emailInput.id).toBe('newsletter-email')
    expect(elements.consentCheckbox.id).toBe('newsletter-gdpr-consent')
  })

  test('validates missing and malformed email input before submission', () => {
    const elements = getElements()

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    elements.form.dispatchEvent(submitEvent)
    expect(elements.message.textContent).toBe('Please enter your email address.')

    elements.emailInput.value = 'invalid-email'
    elements.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(elements.message.textContent).toBe('Please enter a valid email address.')
  })

  test('requires GDPR consent before submitting the form', () => {
    const elements = getElements()

    elements.emailInput.value = 'test@example.com'
    elements.consentCheckbox.checked = false

    elements.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(elements.message.textContent).toBe('Please consent to receive marketing communications.')
  })

  test('submits to the newsletter API and shows success feedback', async () => {
    const elements = getElements()

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Subscribed successfully!' }),
    })

    elements.emailInput.value = 'test@example.com'
    elements.consentCheckbox.checked = true

    elements.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com', consentGiven: true }),
    })
    expect(elements.message.textContent).toBe('Subscribed successfully!')
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.buttonSpinner.classList.contains('hidden')).toBe(true)
  })

  test('handles API error responses gracefully', async () => {
    const elements = getElements()

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Subscription failed' }),
    })

    elements.emailInput.value = 'test@example.com'
    elements.consentCheckbox.checked = true

    elements.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(fetchMock).toHaveBeenCalled()
    expect(elements.message.textContent).toBe('Subscription failed')
  })

  test('shows a network error message when fetch rejects', async () => {
    const elements = getElements()

    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    elements.emailInput.value = 'test@example.com'
    elements.consentCheckbox.checked = true

    elements.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(fetchMock).toHaveBeenCalled()
    expect(elements.message.textContent).toBe('Network error. Please check your connection and try again.')
  })

  test('validates addresses on blur for real-time feedback', () => {
    const elements = getElements()

    elements.emailInput.value = 'invalid-email'
    elements.emailInput.dispatchEvent(new Event('blur'))
    expect(elements.message.textContent).toBe('Please enter a valid email address.')

    elements.emailInput.value = 'test@example.com'
    elements.emailInput.dispatchEvent(new Event('blur'))
    expect(elements.message.textContent).toBe(
      "You'll receive a confirmation email. Click the link to complete your subscription."
    )
  })
})
