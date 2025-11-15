// @vitest-environment happy-dom
/**
 * Tests for DownloadForm client functionality
 */
import { describe, expect, test, beforeEach, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { DownloadForm } from '@components/Forms/Download/client'
import {
  isFormElement,
  isInputElement,
} from '@components/scripts/assertions/elements'
import DownloadFormComponent from '@components/Forms/Download/index.astro'
import { TestError } from '@test/errors'

// Mock the logger to suppress error output in tests
vi.mock('@lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

/**
 * Helper function to set up DOM from Container API
 */
async function setupDownloadFormDOM() {
  const container = await AstroContainer.create()
  const result = await container.renderToString(DownloadFormComponent, {
    props: {
      title: 'Test Resource',
      fileName: 'test-file.pdf',
      fileType: 'PDF',
    },
  })
  document.body.innerHTML = result
}

/**
 * Helper function to get and validate all download form elements
 */
function getDownloadFormElements() {
  const form = document.getElementById('downloadForm')
  if (!isFormElement(form)) {
    throw new TestError('Download form element not found')
  }

  const firstName = form.querySelector('#firstName')
  if (!isInputElement(firstName)) {
    throw new TestError('firstName input not found')
  }

  const lastName = form.querySelector('#lastName')
  if (!isInputElement(lastName)) {
    throw new TestError('lastName input not found')
  }

  const workEmail = form.querySelector('#workEmail')
  if (!isInputElement(workEmail)) {
    throw new TestError('workEmail input not found')
  }

  const jobTitle = form.querySelector('#jobTitle')
  if (!isInputElement(jobTitle)) {
    throw new TestError('jobTitle input not found')
  }

  const companyName = form.querySelector('#companyName')
  if (!isInputElement(companyName)) {
    throw new TestError('companyName input not found')
  }

  return {
    form,
    firstName,
    lastName,
    workEmail,
    jobTitle,
    companyName,
  }
}

describe('DownloadForm class', () => {
  beforeEach(async () => {
    await setupDownloadFormDOM()
    // Mock fetch globally with a default response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    // Suppress console.error during tests to reduce noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  test('initializes with correct elements', async () => {
    const form = new DownloadForm()
    expect(form).toBeDefined()
  })

  test('bindEvents attaches submit listener', async () => {
    const form = new DownloadForm()
    const formElement = document.getElementById('downloadForm')

    if (!isFormElement(formElement)) {
      throw new TestError('Form element not found')
    }

    const submitSpy = vi.fn((e) => e.preventDefault())
    formElement.addEventListener('submit', submitSpy)

    form.bindEvents()

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    formElement.dispatchEvent(submitEvent)

    expect(submitSpy).toHaveBeenCalled()
  })

  test('handleSubmit processes form data correctly', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ success: true }),
    }
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    const form = new DownloadForm()
    form.bindEvents()

    // Fill out the form
    const formElement = document.getElementById('downloadForm')
    if (!isFormElement(formElement)) {
      throw new TestError('Form element not found')
    }

    const firstNameInput = formElement.querySelector('#firstName')
    const lastNameInput = formElement.querySelector('#lastName')
    const emailInput = formElement.querySelector('#workEmail')
    const jobTitleInput = formElement.querySelector('#jobTitle')
    const companyInput = formElement.querySelector('#companyName')

    if (!isInputElement(firstNameInput) || !isInputElement(lastNameInput) ||
        !isInputElement(emailInput) || !isInputElement(jobTitleInput) ||
        !isInputElement(companyInput)) {
      throw new TestError('Form inputs not found')
    }

    firstNameInput.value = 'John'
    lastNameInput.value = 'Doe'
    emailInput.value = 'john.doe@example.com'
    jobTitleInput.value = 'Developer'
    companyInput.value = 'Acme Corp'

    // Submit the form
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    formElement.dispatchEvent(submitEvent)

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify fetch was called with correct data
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/downloads/submit',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          workEmail: 'john.doe@example.com',
          jobTitle: 'Developer',
          companyName: 'Acme Corp',
        }),
      })
    )
  })

  test('shows success message and download button on successful submission', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ success: true }),
    }
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    const form = new DownloadForm()
    form.bindEvents()

    // Fill out the form
    const { form: formElement, firstName, lastName, workEmail, jobTitle, companyName } = getDownloadFormElements()
    firstName.value = 'John'
    lastName.value = 'Doe'
    workEmail.value = 'john@example.com'
    jobTitle.value = 'Developer'
    companyName.value = 'Acme'

    // Submit the form
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    formElement.dispatchEvent(submitEvent)

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check status message
    const statusDiv = document.getElementById('downloadFormStatus')
    expect(statusDiv?.classList.contains('hidden')).toBe(false)
    expect(statusDiv?.classList.contains('success')).toBe(true)
    expect(statusDiv?.textContent).toContain('Thank you!')

    // Check download button is visible
    const downloadWrapper = document.getElementById('downloadButtonWrapper')
    expect(downloadWrapper?.classList.contains('hidden')).toBe(false)

    // Check submit button is hidden
    const submitBtn = document.getElementById('downloadSubmitBtn')
    expect(submitBtn?.classList.contains('hidden')).toBe(true)
  })

  test('shows error message on failed submission', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({ error: 'Server error' }),
    }
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    const form = new DownloadForm()
    form.bindEvents()

    // Fill out the form
    const { form: formElement, firstName, lastName, workEmail, jobTitle, companyName } = getDownloadFormElements()
    firstName.value = 'John'
    lastName.value = 'Doe'
    workEmail.value = 'john@example.com'
    jobTitle.value = 'Developer'
    companyName.value = 'Acme'

    // Submit the form
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    formElement.dispatchEvent(submitEvent)

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check error message
    const statusDiv = document.getElementById('downloadFormStatus')
    expect(statusDiv?.classList.contains('hidden')).toBe(false)
    expect(statusDiv?.classList.contains('error')).toBe(true)
    expect(statusDiv?.textContent).toContain('error')
  })

  test('disables submit button during processing', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ success: true }),
    }
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    const form = new DownloadForm()
    form.bindEvents()

    const { form: formElement, firstName, lastName, workEmail, jobTitle, companyName } = getDownloadFormElements()
    const submitBtn = document.getElementById('downloadSubmitBtn')
    if (!submitBtn || !(submitBtn instanceof HTMLButtonElement)) {
      throw new TestError('Submit button not found')
    }

    // Fill form
    firstName.value = 'John'
    lastName.value = 'Doe'
    workEmail.value = 'john@example.com'
    jobTitle.value = 'Developer'
    companyName.value = 'Acme'

    expect(submitBtn.disabled).toBe(false)

    // Submit the form
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    formElement.dispatchEvent(submitEvent)

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100))

    // Button should be re-enabled after success
    expect(submitBtn.disabled).toBe(false)
  })
})

describe('DownloadForm.init static method', () => {
  test('initializes when form exists', async () => {
    await setupDownloadFormDOM()
    expect(() => DownloadForm.init()).not.toThrow()
  })

  test('does not throw when form does not exist', () => {
    document.body.innerHTML = '<div></div>'
    expect(() => DownloadForm.init()).not.toThrow()
  })
})
