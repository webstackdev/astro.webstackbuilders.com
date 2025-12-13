import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import Newsletter from '@components/CallToAction/Newsletter/index.astro'
import type { NewsletterProps } from '@components/CallToAction/Newsletter/props'
import type { NewsletterFormElement } from '@components/CallToAction/Newsletter/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type NewsletterComponentModule = WebComponentModule<NewsletterFormElement>

const flushPromises = async () => {
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

const defaultNewsletterProps: NewsletterProps = {
  title: 'Test Newsletter',
  description: 'Test description for newsletter signup',
  placeholder: 'test@example.com',
  buttonText: 'Subscribe',
}

const getElements = (root: NewsletterFormElement) => {
  const selectElement = <T extends Element>(selector: string): T => {
    const element = root.querySelector(selector)
    if (!element) {
      throw new TestError(`Failed to locate ${selector} within newsletter-form`)
    }
    return element as T
  }

  return {
    form: selectElement<HTMLFormElement>('#newsletter-form'),
    emailInput: selectElement<HTMLInputElement>('#newsletter-email'),
    consentCheckbox: selectElement<HTMLInputElement>('#newsletter-gdpr-consent'),
    submitButton: selectElement<HTMLButtonElement>('#newsletter-submit'),
    buttonText: selectElement<HTMLSpanElement>('#button-text'),
    buttonArrow: selectElement<SVGSVGElement>('#button-arrow'),
    buttonSpinner: selectElement<SVGSVGElement>('#button-spinner'),
    message: selectElement<HTMLParagraphElement>('#newsletter-message'),
  }
}

describe('NewsletterFormElement web component', () => {
  let container: AstroContainer
  let fetchMock: ReturnType<typeof vi.fn>
  const originalFetch = globalThis.fetch

  beforeEach(async () => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    container = await AstroContainer.create()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  const renderNewsletter = async (
    assertion: (_context: { element: NewsletterFormElement; elements: ReturnType<typeof getElements> }) =>
      Promise<void> | void,
    props: Partial<NewsletterProps> = {},
  ) => {
    await executeRender<NewsletterComponentModule>({
      container,
      component: Newsletter,
      moduleSpecifier: '@components/CallToAction/Newsletter/client/index',
      args: {
        props: {
          ...defaultNewsletterProps,
          ...props,
        },
      },
      waitForReady: async element => {
        element.initialize()
        await flushPromises()
      },
      assert: async ({ element }) => {
        const elements = getElements(element)
        await assertion({ element, elements })
      },
    })
  }

  test('registers the custom element and hydrates DOM references', async () => {
    await renderNewsletter(async ({ elements }) => {
      expect(customElements.get('newsletter-form')).toBeDefined()
      expect(elements.form.id).toBe('newsletter-form')
      expect(elements.emailInput.id).toBe('newsletter-email')
      expect(elements.consentCheckbox.id).toBe('newsletter-gdpr-consent')
    })
  })

  test('validates missing and malformed email input before submission', async () => {
    await renderNewsletter(async ({ elements }) => {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      elements.form.dispatchEvent(submitEvent)
      expect(elements.message.textContent).toBe('Please enter your email address.')

      elements.emailInput.value = 'invalid-email'
      elements.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      expect(elements.message.textContent).toBe('Please enter a valid email address.')
    })
  })

  test('requires GDPR consent before submitting the form', async () => {
    await renderNewsletter(async ({ elements }) => {
      elements.emailInput.value = 'test@example.com'
      elements.consentCheckbox.checked = false

      elements.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      expect(elements.message.textContent).toBe('Please consent to receive marketing communications.')
    })
  })

  test('submits to the newsletter API and shows success feedback', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Subscribed successfully!' }),
    })

    await renderNewsletter(async ({ elements }) => {
      const confettiFireHandler = vi.fn()
      elements.submitButton.addEventListener('confetti:fire', confettiFireHandler)

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
      expect(confettiFireHandler).toHaveBeenCalledTimes(1)
      expect(elements.submitButton.disabled).toBe(false)
      expect(elements.buttonSpinner.classList.contains('hidden')).toBe(true)
    })
  })

  test('handles API error responses gracefully', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Subscription failed' }),
    })

    await renderNewsletter(async ({ elements }) => {
      elements.emailInput.value = 'test@example.com'
      elements.consentCheckbox.checked = true

      elements.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await flushPromises()

      expect(fetchMock).toHaveBeenCalled()
      expect(elements.message.textContent).toBe('Subscription failed')
    })
  })

  test('shows a network error message when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TestError('Network error'))

    await renderNewsletter(async ({ elements }) => {
      elements.emailInput.value = 'test@example.com'
      elements.consentCheckbox.checked = true

      elements.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await flushPromises()

      expect(fetchMock).toHaveBeenCalled()
      expect(elements.message.textContent).toBe('Network error. Please check your connection and try again.')
    })
  })

  test('validates addresses on blur for real-time feedback', async () => {
    await renderNewsletter(async ({ elements }) => {
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
})
