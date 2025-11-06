// @vitest-environment happy-dom
/**
 * Tests for Newsletter form component using Container API pattern with happy-dom
 */
import { beforeAll, beforeEach, describe, expect, test, vi, afterEach } from 'vitest'
import { NewsletterForm } from '@components/CallToAction/Newsletter/client'
import { setupNewsletterDOM, getFormElements } from '@components/CallToAction/Newsletter/__fixtures__/newsletter.fixture'

// Mock fetch for API testing
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeAll(() => {
  vi.useFakeTimers()
})

beforeEach(() => {
  vi.clearAllMocks()
  // Reset fetch mock
  mockFetch.mockClear()
})

afterEach(() => {
  // Clean up DOM
  document.body.innerHTML = ''
})

describe('NewsletterForm class works', () => {
  test('LoadableScript init initializes', async () => {
    await setupNewsletterDOM()

    // Verify required elements exist
    const elements = getFormElements()
    expect(elements.form).toBeTruthy()
    expect(elements.emailInput).toBeTruthy()
    expect(elements.submitButton).toBeTruthy()

    // Initialize the component
    NewsletterForm.init()

    // Verify initialization doesn't throw
    expect(() => new NewsletterForm()).not.toThrow()
  })

  test('validates email addresses correctly', async () => {
    await setupNewsletterDOM()

    const newsletter = new NewsletterForm()

    // Test valid emails
    expect(newsletter.validateEmail('test@example.com')).toBe(true)
    expect(newsletter.validateEmail('user.name+tag@domain.co.uk')).toBe(true)

    // Test invalid emails
    expect(newsletter.validateEmail('')).toBe(false)
    expect(newsletter.validateEmail('invalid')).toBe(false)
    expect(newsletter.validateEmail('test@')).toBe(false)
    expect(newsletter.validateEmail('@domain.com')).toBe(false)
  })

  test('displays messages with correct styling', async () => {
    await setupNewsletterDOM()

    const newsletter = new NewsletterForm()
    const elements = getFormElements()

    // Test success message
    newsletter.showMessage('Success message', 'success')
    expect(elements.message.textContent).toBe('Success message')
    expect(elements.message.classList.contains('text-[var(--color-success)]')).toBe(true)

    // Test error message
    newsletter.showMessage('Error message', 'error')
    expect(elements.message.textContent).toBe('Error message')
    expect(elements.message.classList.contains('text-[var(--color-danger)]')).toBe(true)

    // Test info message
    newsletter.showMessage('Info message', 'info')
    expect(elements.message.textContent).toBe('Info message')
    expect(elements.message.classList.contains('text-[var(--color-text-offset)]')).toBe(true)
  })

  test('handles loading state correctly', async () => {
    await setupNewsletterDOM()

    const newsletter = new NewsletterForm()
    const elements = getFormElements()

    // Test loading state
    newsletter.setLoading(true)
    expect(elements.submitButton.disabled).toBe(true)
    expect(elements.buttonText.textContent).toBe('Subscribing...')
    expect(elements.buttonArrow.classList.contains('hidden')).toBe(true)
    expect(elements.buttonSpinner.classList.contains('hidden')).toBe(false)

    // Test non-loading state
    newsletter.setLoading(false)
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.buttonText.textContent).toBe('Subscribe')
    expect(elements.buttonArrow.classList.contains('hidden')).toBe(false)
    expect(elements.buttonSpinner.classList.contains('hidden')).toBe(true)
  })

  test('validates empty email on form submit', async () => {
    await setupNewsletterDOM()

    const newsletter = new NewsletterForm()
    newsletter.bindEvents()
    const elements = getFormElements()

    // Submit empty form
    const submitEvent = new Event('submit')
    elements.form.dispatchEvent(submitEvent)

    expect(elements.message.textContent).toBe('Please enter your email address.')
    expect(elements.message.classList.contains('text-[var(--color-danger)]')).toBe(true)
  })

  test('validates invalid email on form submit', async () => {
    await setupNewsletterDOM()

    const newsletter = new NewsletterForm()
    newsletter.bindEvents()
    const elements = getFormElements()

    // Enter invalid email and submit
    elements.emailInput.value = 'invalid-email'
    const submitEvent = new Event('submit')
    elements.form.dispatchEvent(submitEvent)

    expect(elements.message.textContent).toBe('Please enter a valid email address.')
    expect(elements.message.classList.contains('text-[var(--color-danger)]')).toBe(true)
  })

  test('handles successful API response', async () => {
    await setupNewsletterDOM()

    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Subscribed successfully!' }),
    })

    const newsletter = new NewsletterForm()
    newsletter.bindEvents()
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

  test('handles API error response', async () => {
    await setupNewsletterDOM()

    // Mock error API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Subscription failed' }),
    })

    const newsletter = new NewsletterForm()
    newsletter.bindEvents()
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

  test('handles network error', async () => {
    await setupNewsletterDOM()

    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const newsletter = new NewsletterForm()
    newsletter.bindEvents()
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

  test('validates email on blur event', async () => {
    await setupNewsletterDOM()

    const newsletter = new NewsletterForm()
    newsletter.bindEvents()
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

  test('unbinds events correctly', async () => {
    await setupNewsletterDOM()

    const newsletter = new NewsletterForm()
    const elements = getFormElements()

    // Bind events
    newsletter.bindEvents()

    // Spy on removeEventListener
    const formSpy = vi.spyOn(elements.form, 'removeEventListener')
    const inputSpy = vi.spyOn(elements.emailInput, 'removeEventListener')

    // Unbind events
    newsletter.unbindEvents()

    expect(formSpy).toHaveBeenCalledWith('submit', expect.any(Function))
    expect(inputSpy).toHaveBeenCalledWith('blur', expect.any(Function))
  })
})

describe('NewsletterForm LoadableScript implementation', () => {
  test('has correct static properties', () => {
    expect(NewsletterForm.scriptName).toBe('NewsletterForm')
    expect(NewsletterForm.eventType).toBe('astro:page-load')
  })

  test('static init method works', async () => {
    await setupNewsletterDOM()

    expect(() => NewsletterForm.init()).not.toThrow()
  })

  test('static methods exist and are callable', () => {
    expect(typeof NewsletterForm.pause).toBe('function')
    expect(typeof NewsletterForm.resume).toBe('function')
    expect(typeof NewsletterForm.reset).toBe('function')

    expect(() => NewsletterForm.pause()).not.toThrow()
    expect(() => NewsletterForm.resume()).not.toThrow()
    expect(() => NewsletterForm.reset()).not.toThrow()
  })
})

describe('Edge cases and error handling', () => {
  test('throws error for missing DOM elements', () => {
    // Set up DOM without required elements
    document.body.innerHTML = '<div>No newsletter form</div>'

    // Newsletter is a critical component (Phase 1), should throw when instantiated
    expect(() => new NewsletterForm()).toThrow('NewsletterForm: Required DOM elements not found')
  })

  test('throws error for partially missing elements', async () => {
    // Form exists but missing required input
    document.body.innerHTML = '<form id="newsletter-form"></form>'

    // Missing email input and other required elements should throw
    expect(() => new NewsletterForm()).toThrow('NewsletterForm: Required DOM elements not found')
  })
})
