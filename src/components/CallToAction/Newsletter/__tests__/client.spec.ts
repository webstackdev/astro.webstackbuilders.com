// @vitest-environment happy-dom
/**
 * Tests for Newsletter form web component using Container API pattern with happy-dom
 */
import { beforeAll, beforeEach, describe, expect, test, vi, afterEach } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { NewsletterFormElement } from '@components/CallToAction/Newsletter/client'
import { getNewsletterElements } from '@components/CallToAction/Newsletter/selectors'
import NewsletterFixture from '@components/CallToAction/Newsletter/__fixtures__/client.fixture.astro'

/**
 * Helper function to get form elements after DOM setup
 * Uses the same selector function as production code
 */
function getFormElements() {
  const customElement = document.querySelector('newsletter-form')
  if (!customElement) {
    throw new Error('newsletter-form custom element not found')
  }
  return getNewsletterElements(customElement)
}

// Mock fetch for API testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('NewsletterFormElement web component', () => {
  let container: AstroContainer
  let html: string

  beforeAll(() => {
    vi.useFakeTimers()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mockFetch.mockClear()

    container = await AstroContainer.create()
    html = await container.renderToString(NewsletterFixture)

    console.log('=== RENDERED HTML ===')
    console.log(html.substring(0, 1000))
    console.log('=== END HTML ===')

    document.body.innerHTML = html

    // Get the web component and manually initialize it
    // Don't trigger global DOMContentLoaded as it causes issues with other components
    const newsletterElement = document.querySelector('newsletter-form') as NewsletterFormElement

    console.log('Newsletter element found:', !!newsletterElement)
    console.log('Custom element defined:', !!customElements.get('newsletter-form'))

    if (newsletterElement) {
      newsletterElement.initialize()
    }

    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })
  test.skip('custom element is defined', () => {
    // Verify custom element is registered
    expect(customElements.get('newsletter-form')).toBeDefined()
  })

  test.skip('web component renders with required elements', () => {
    const newsletterElement = document.querySelector('newsletter-form')
    expect(newsletterElement).toBeTruthy()

    // Verify required elements exist
    const elements = getFormElements()
    expect(elements.form).toBeTruthy()
    expect(elements.emailInput).toBeTruthy()
    expect(elements.submitButton).toBeTruthy()
  })

  test.skip('validates email addresses correctly', () => {
    const newsletterElement = document.querySelector('newsletter-form') as NewsletterFormElement
    expect(newsletterElement).toBeTruthy()

    // Access private method via any type for testing
    const element = newsletterElement as any

    // Test valid emails
    expect(element.validateEmail('test@example.com')).toBe(true)
    expect(element.validateEmail('user.name+tag@domain.co.uk')).toBe(true)

    // Test invalid emails
    expect(element.validateEmail('')).toBe(false)
    expect(element.validateEmail('invalid')).toBe(false)
    expect(element.validateEmail('test@')).toBe(false)
    expect(element.validateEmail('@domain.com')).toBe(false)
  })

  test.skip('displays messages with correct styling', () => {
    const newsletterElement = document.querySelector('newsletter-form') as NewsletterFormElement
    const element = newsletterElement as any
    const elements = getFormElements()

    // Test success message
    element.showMessage('Success message', 'success')
    expect(elements.message.textContent).toBe('Success message')
    expect(elements.message.classList.contains('text-[var(--color-success)]')).toBe(true)

    // Test error message
    element.showMessage('Error message', 'error')
    expect(elements.message.textContent).toBe('Error message')
    expect(elements.message.classList.contains('text-[var(--color-danger)]')).toBe(true)

    // Test info message
    element.showMessage('Info message', 'info')
    expect(elements.message.textContent).toBe('Info message')
    expect(elements.message.classList.contains('text-[var(--color-text-offset)]')).toBe(true)
  })

  test.skip('handles loading state correctly', () => {
    const newsletterElement = document.querySelector('newsletter-form') as NewsletterFormElement
    const element = newsletterElement as any
    const elements = getFormElements()

    // Test loading state
    element.setLoading(true)
    expect(elements.submitButton.disabled).toBe(true)
    expect(elements.buttonText.textContent).toBe('Subscribing...')
    expect(elements.buttonArrow.classList.contains('hidden')).toBe(true)
    expect(elements.buttonSpinner.classList.contains('hidden')).toBe(false)

    // Test non-loading state
    element.setLoading(false)
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.buttonText.textContent).toBe('Subscribe')
    expect(elements.buttonArrow.classList.contains('hidden')).toBe(false)
    expect(elements.buttonSpinner.classList.contains('hidden')).toBe(true)
  })

  test.skip('validates empty email on form submit', () => {
    const elements = getFormElements()

    // Submit empty form
    const submitEvent = new Event('submit')
    elements.form.dispatchEvent(submitEvent)

    expect(elements.message.textContent).toBe('Please enter your email address.')
    expect(elements.message.classList.contains('text-[var(--color-danger)]')).toBe(true)
  })

  test.skip('validates invalid email on form submit', () => {
    const elements = getFormElements()

    // Enter invalid email and submit
    elements.emailInput.value = 'invalid-email'
    const submitEvent = new Event('submit')
    elements.form.dispatchEvent(submitEvent)

    expect(elements.message.textContent).toBe('Please enter a valid email address.')
    expect(elements.message.classList.contains('text-[var(--color-danger)]')).toBe(true)
  })

  test.skip('handles successful API response', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Subscribed successfully!' }),
    })

    const elements = getFormElements()

    // Enter valid email, check consent, and submit
    elements.emailInput.value = 'test@example.com'
    elements.consentCheckbox.checked = true
    const submitEvent = new Event('submit')
    elements.form.dispatchEvent(submitEvent)

    // Wait for async operations
    await vi.runAllTimersAsync()

    expect(fetch).toHaveBeenCalledWith('/api/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com', consentGiven: true }),
    })
  })

  test.skip('handles API error response', async () => {
    // Mock error API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Subscription failed' }),
    })

    const elements = getFormElements()

    // Enter valid email, check consent, and submit
    elements.emailInput.value = 'test@example.com'
    elements.consentCheckbox.checked = true
    const submitEvent = new Event('submit')
    elements.form.dispatchEvent(submitEvent)

    // Wait for async operations
    await vi.runAllTimersAsync()

    expect(fetch).toHaveBeenCalled()
  })

  test.skip('handles network error', async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const elements = getFormElements()

    // Enter valid email, check consent, and submit
    elements.emailInput.value = 'test@example.com'
    elements.consentCheckbox.checked = true
    const submitEvent = new Event('submit')
    elements.form.dispatchEvent(submitEvent)

    // Wait for async operations
    await vi.runAllTimersAsync()

    expect(fetch).toHaveBeenCalled()
  })

  test.skip('validates email on blur event', () => {
    const elements = getFormElements()

    // Enter invalid email and blur
    elements.emailInput.value = 'invalid-email'
    const blurEvent = new Event('blur')
    elements.emailInput.dispatchEvent(blurEvent)

    expect(elements.message.textContent).toBe('Please enter a valid email address.')
    expect(elements.message.classList.contains('text-[var(--color-danger)]')).toBe(true)

    // Enter valid email and blur
    elements.emailInput.value = 'test@example.com'
    elements.emailInput.dispatchEvent(blurEvent)

    expect(elements.message.textContent).toBe("You'll receive a confirmation email. Click the link to complete your subscription.")
    expect(elements.message.classList.contains('text-[var(--color-text-offset)]')).toBe(true)
  })

  test.skip('web component lifecycle works correctly', () => {
    const newsletterElement = document.querySelector('newsletter-form') as NewsletterFormElement
    const elements = getFormElements()

    // Verify element is initialized
    expect(newsletterElement).toBeTruthy()

    // Verify events are bound (submit should trigger validation)
    const submitEvent = new Event('submit')
    elements.form.dispatchEvent(submitEvent)
    expect(elements.message.textContent).toBe('Please enter your email address.')
  })
})

describe('Web component lifecycle and behavior', () => {
  test.skip('custom element auto-initializes', () => {
    const newsletterElement = document.querySelector('newsletter-form')
    expect(newsletterElement).toBeTruthy()
    expect(newsletterElement?.tagName.toLowerCase()).toBe('newsletter-form')
  })

  test.skip('handles re-initialization gracefully', () => {
    // Component should handle multiple setups without errors
    const newsletterElement = document.querySelector('newsletter-form') as NewsletterFormElement
    const element = newsletterElement as any

    // Calling initialize multiple times should be safe
    expect(() => element.initialize()).not.toThrow()
  })
})

describe('Edge cases and error handling', () => {
  test.skip('handles missing DOM elements gracefully', () => {
    // Set up DOM without newsletter-form element
    document.body.innerHTML = '<div>No newsletter form</div>'

    // Web component won't be present
    const newsletterElement = document.querySelector('newsletter-form')
    expect(newsletterElement).toBeNull()
  })

  test.skip('handles missing required elements inside web component', async () => {
    // Create web component but with empty content
    document.body.innerHTML = '<newsletter-form></newsletter-form>'

    const newsletterElement = document.querySelector('newsletter-form')
    expect(newsletterElement).toBeTruthy()

    // Form elements won't exist, but component should handle gracefully
    const elements = getFormElements()
    expect(elements.form).toBeNull()
  })

  test.skip('validates consent checkbox requirement', async () => {
    const elements = getFormElements()

    // Enter valid email but don't check consent
    elements.emailInput.value = 'test@example.com'
    elements.consentCheckbox.checked = false

    const submitEvent = new Event('submit')
    elements.form.dispatchEvent(submitEvent)

    expect(elements.message.textContent).toBe('Please consent to receive marketing communications.')
    expect(elements.message.classList.contains('text-[var(--color-danger)]')).toBe(true)
  })
})
