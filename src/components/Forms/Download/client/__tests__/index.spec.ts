import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderDownloadForm, type DownloadFormElements } from './testUtils'

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

const successfulResponse = (): Response =>
  ({
    ok: true,
    json: async () => ({ success: true }),
  } as Response)

describe('download-form web component', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('submits download requests via fetch', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulResponse())
      const payload = fillDownloadForm(elements)

      submitForm(window, elements.form)
      await flushPromises()

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/downloads/submit',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }),
      )

      fetchSpy.mockRestore()
    })
  })

  it('shows success message and reveals download button', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulResponse())
      fillDownloadForm(elements)

      submitForm(window, elements.form)
      await flushPromises()

      expect(elements.statusDiv.classList.contains('hidden')).toBe(false)
      expect(elements.statusDiv.classList.contains('success')).toBe(true)
      expect(elements.statusDiv.textContent).toContain('Thank you')
      expect(elements.downloadButtonWrapper.classList.contains('hidden')).toBe(false)
      expect(elements.submitButton.classList.contains('hidden')).toBe(true)
      expect(elements.firstName.value).toBe('')
      expect(elements.lastName.value).toBe('')
      expect(elements.workEmail.value).toBe('')

      fetchSpy.mockRestore()
    })
  })

  it('dispatches a confetti:fire event from the submit button on success', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulResponse())
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

      fetchSpy.mockRestore()
    })
  })

  it('displays error state when API fails', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      } as Response)

      fillDownloadForm(elements)
      submitForm(window, elements.form)
      await flushPromises()

      expect(fetchSpy).toHaveBeenCalled()
      expect(elements.statusDiv.classList.contains('hidden')).toBe(false)
      expect(elements.statusDiv.classList.contains('error')).toBe(true)
      expect(elements.statusDiv.textContent).toContain('There was an error processing your request')
      expect(elements.downloadButtonWrapper.classList.contains('hidden')).toBe(true)
      expect(elements.submitButton.classList.contains('hidden')).toBe(false)

      fetchSpy.mockRestore()
    })
  })

  it('disables submit button while request is pending', async () => {
    await renderDownloadForm(async ({ elements, window }) => {
      let resolveFetch: (() => void) | undefined
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
        () =>
          new Promise(resolve => {
            resolveFetch = () => resolve(successfulResponse())
          }),
      )

      fillDownloadForm(elements)
      submitForm(window, elements.form)

      expect(elements.submitButton.disabled).toBe(true)
      expect(elements.submitButton.textContent).toBe('Processing...')

      resolveFetch?.()
      await flushPromises()

      expect(fetchSpy).toHaveBeenCalled()
      expect(elements.submitButton.disabled).toBe(false)
      expect(elements.submitButton.textContent).toBe('Download Now')

      fetchSpy.mockRestore()
    })
  })
})

