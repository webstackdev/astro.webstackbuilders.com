import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { DownloadFormElements } from './testUtils'

const downloadsSubmitMock = vi.fn()

vi.mock('astro:actions', () => ({
  actions: {
    downloads: {
      submit: downloadsSubmitMock,
    },
  },
}))

// Mock the logger to suppress error output in tests
vi.mock('@lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

let renderDownloadForm: typeof import('./testUtils').renderDownloadForm

beforeAll(async () => {
  ;({ renderDownloadForm } = await import('./testUtils'))
})

const defaultFormValues = {
  firstName: 'Jane',
  lastName: 'Doe',
  workEmail: 'jane@example.com',
  jobTitle: 'Engineer',
  companyName: 'Acme Corp',
}

const fillDownloadForm = (
  elements: DownloadFormElements,
  overrides: Partial<typeof defaultFormValues> = {},
) => {
  const values = { ...defaultFormValues, ...overrides }
  elements.firstName.value = values.firstName
  elements.lastName.value = values.lastName
  elements.workEmail.value = values.workEmail
  elements.jobTitle.value = values.jobTitle
  elements.companyName.value = values.companyName
  return values
}

const submitForm = (window: Window & typeof globalThis, form: HTMLFormElement) => {
  const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true })
  form.dispatchEvent(submitEvent)
}

describe('download-form web component', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    downloadsSubmitMock.mockReset()
  })

  it('does not submit when native form validation fails', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      vi.spyOn(elements.form, 'checkValidity').mockReturnValue(false)
      vi.spyOn(elements.form, 'reportValidity').mockReturnValue(false)

      // Leave inputs empty; validation is stubbed to fail.
      submitForm(window, elements.form)
      await flushPromises()

      expect(downloadsSubmitMock).not.toHaveBeenCalled()
      expect(elements.firstName.getAttribute('aria-invalid')).toBe('true')

      expect(elements.statusDiv.classList.contains('hidden')).toBe(false)
      expect(elements.statusDiv.classList.contains('error')).toBe(true)
      expect(elements.statusDiv.getAttribute('role')).toBe('alert')
      expect(elements.statusDiv.getAttribute('aria-live')).toBe('assertive')
    })
  })

  it('submits download requests via actions', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      downloadsSubmitMock.mockResolvedValue({ data: { success: true } })
      const payload = fillDownloadForm(elements)

      submitForm(window, elements.form)
      await flushPromises()

      expect(downloadsSubmitMock).toHaveBeenCalledWith(payload)
    })
  })

  it('shows success message and reveals download button', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      downloadsSubmitMock.mockResolvedValue({ data: { success: true } })
      fillDownloadForm(elements)

      submitForm(window, elements.form)
      await flushPromises()

      expect(elements.statusDiv.classList.contains('hidden')).toBe(false)
      expect(elements.statusDiv.classList.contains('success')).toBe(true)
      expect(elements.statusDiv.textContent).toContain('Thank you')
      expect(elements.statusDiv.getAttribute('role')).toBe('status')
      expect(elements.statusDiv.getAttribute('aria-live')).toBe('polite')
      expect(elements.downloadButtonWrapper.classList.contains('hidden')).toBe(false)
      expect(elements.submitButton.classList.contains('hidden')).toBe(true)
      expect(elements.firstName.value).toBe('')
      expect(elements.lastName.value).toBe('')
      expect(elements.workEmail.value).toBe('')
    })
  })

  it('dispatches a confetti:fire event from the submit button on success', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      downloadsSubmitMock.mockResolvedValue({ data: { success: true } })
      fillDownloadForm(elements)

      let confettiEvent: Event | undefined
      elements.submitButton.addEventListener('confetti:fire', (event) => {
        confettiEvent = event
      })

      submitForm(window, elements.form)
      await flushPromises()

      expect(confettiEvent).toBeDefined()
      expect(confettiEvent?.target).toBe(elements.submitButton)
      expect(confettiEvent?.bubbles).toBe(true)
      expect((confettiEvent as CustomEvent)?.composed).toBe(true)
    })
  })

  it('displays error state when API fails', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      downloadsSubmitMock.mockResolvedValue({ error: { message: 'Server error' } })

      fillDownloadForm(elements)
      submitForm(window, elements.form)
      await flushPromises()

      expect(downloadsSubmitMock).toHaveBeenCalled()
      expect(elements.statusDiv.classList.contains('hidden')).toBe(false)
      expect(elements.statusDiv.classList.contains('error')).toBe(true)
      expect(elements.statusDiv.textContent).toContain('There was an error processing your request')
      expect(elements.statusDiv.getAttribute('role')).toBe('alert')
      expect(elements.statusDiv.getAttribute('aria-live')).toBe('assertive')
      expect(elements.downloadButtonWrapper.classList.contains('hidden')).toBe(true)
      expect(elements.submitButton.classList.contains('hidden')).toBe(false)
    })
  })

  it('disables submit button while request is pending', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      let resolveSubmit: (() => void) | undefined
      downloadsSubmitMock.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveSubmit = () => resolve({ data: { success: true } })
          }),
      )

      fillDownloadForm(elements)
      submitForm(window, elements.form)

      expect(elements.submitButton.disabled).toBe(true)
      expect(elements.submitButton.textContent).toBe('Processing...')

      resolveSubmit?.()
      await flushPromises()

      expect(downloadsSubmitMock).toHaveBeenCalled()
      expect(elements.submitButton.disabled).toBe(false)
      expect(elements.submitButton.textContent).toBe('Download Now')
    })
  })
})

