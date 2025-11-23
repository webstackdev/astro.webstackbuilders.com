// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import {
  getDownloadButtonWrapper,
  getDownloadCompanyNameInput,
  getDownloadFirstNameInput,
  getDownloadFormElement,
  getDownloadJobTitleInput,
  getDownloadLastNameInput,
  getDownloadStatusDiv,
  getDownloadSubmitButton,
  getDownloadWorkEmailInput,
} from '@components/Forms/Download/client/selectors'
import DownloadFormComponent from '@components/Forms/Download/index.astro'
import { TestError } from '@test/errors'
import { withLitRuntime } from '@test/unit/helpers/litRuntime'

// Mock the logger to suppress error output in tests
vi.mock('@lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

let container: AstroContainer | undefined
let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined
const originalFetch = global.fetch
let downloadFormClientPromise: Promise<void> | undefined
const downloadFormTagName = 'download-form'

/**
 * Helper function to set up DOM from Container API
 */
async function renderDownloadFormDOM() {
  if (!container) {
    throw new TestError('Astro container not initialized')
  }

  const result = await container.renderToString(DownloadFormComponent, {
    props: {
      title: 'Test Resource',
      fileName: 'test-file.pdf',
      fileType: 'PDF',
    },
  })

  const template = document.createElement('template')
  template.innerHTML = result
  const body = document.body
  body.replaceChildren()
  while (template.content.firstChild) {
    body.appendChild(template.content.firstChild)
  }
}

async function hydrateDownloadFormElement() {
  await customElements.whenDefined(downloadFormTagName)
  const element = document.querySelector(downloadFormTagName)
  if (!element) {
    throw new TestError('download-form element not found in DOM')
  }
  await Promise.resolve()
  return element
}

const withHydratedDownloadForm = async (assertions: () => Promise<void> | void) => {
  await withLitRuntime(async ({ register }) => {
    await register(downloadFormTagName, async () => ensureDownloadFormClient())
    await renderDownloadFormDOM()
    await hydrateDownloadFormElement()
    await assertions()
  })
}

describe('download-form web component', () => {
  beforeAll(() => {
    GlobalRegistrator.register()
  })

  afterAll(async () => {
    await GlobalRegistrator.unregister()
  })

  beforeEach(async () => {
    container = await AstroContainer.create()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    }) as typeof fetch

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
    if (originalFetch) {
      global.fetch = originalFetch
    } else {
      delete (global as typeof global & { fetch?: typeof global.fetch }).fetch
    }
    container = undefined
  })

  test('submits download requests via fetch', async () => {
    await withHydratedDownloadForm(async () => {
      const {
        form,
        firstName,
        lastName,
        workEmail,
        jobTitle,
        companyName,
      } = getDownloadFormElements()
      firstName.value = 'John'
      lastName.value = 'Doe'
      workEmail.value = 'john.doe@example.com'
      jobTitle.value = 'Developer'
      companyName.value = 'Acme Corp'

      await submitFormAndFlush(form)

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
  })

  test('shows success message and reveals download button', async () => {
    await withHydratedDownloadForm(async () => {
      const {
        form,
        firstName,
        lastName,
        workEmail,
        jobTitle,
        companyName,
      } = getDownloadFormElements()
      firstName.value = 'Jane'
      lastName.value = 'Doe'
      workEmail.value = 'jane@example.com'
      jobTitle.value = 'Engineer'
      companyName.value = 'Widgets Inc'

      await submitFormAndFlush(form)

      const statusDiv = getDownloadStatusDiv()
      expect(statusDiv?.classList.contains('hidden')).toBe(false)
      expect(statusDiv?.classList.contains('success')).toBe(true)
      expect(statusDiv?.textContent).toContain('Thank you')

      const downloadWrapper = getDownloadButtonWrapper()
      expect(downloadWrapper?.classList.contains('hidden')).toBe(false)

      const submitButton = getDownloadSubmitButton()
      expect(submitButton?.classList.contains('hidden')).toBe(true)
    })
  })

  test('displays error state when API fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })

    await withHydratedDownloadForm(async () => {
      const {
        form,
        firstName,
        lastName,
        workEmail,
        jobTitle,
        companyName,
      } = getDownloadFormElements()
      firstName.value = 'Sam'
      lastName.value = 'Lee'
      workEmail.value = 'sam@example.com'
      jobTitle.value = 'Analyst'
      companyName.value = 'Example'

      await submitFormAndFlush(form)

      const statusDiv = getDownloadStatusDiv()
      expect(statusDiv?.classList.contains('hidden')).toBe(false)
      expect(statusDiv?.classList.contains('error')).toBe(true)
      expect(statusDiv?.textContent).toContain('error')
    })
  })

  test('disables submit button while request is pending', async () => {
    let resolveFetch: (() => void) | undefined
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve({
              ok: true,
              json: async () => ({ success: true }),
            })
        })
    )

    await withHydratedDownloadForm(async () => {
      const {
        form,
        firstName,
        lastName,
        workEmail,
        jobTitle,
        companyName,
      } = getDownloadFormElements()
      firstName.value = 'Ava'
      lastName.value = 'Jones'
      workEmail.value = 'ava@example.com'
      jobTitle.value = 'PM'
      companyName.value = 'Acme'

      const submitButton = getDownloadSubmitButton()

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)

      expect(submitButton.disabled).toBe(true)
      expect(submitButton.textContent).toBe('Processing...')

      resolveFetch?.()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(submitButton.disabled).toBe(false)
      expect(submitButton.textContent).toBe('Download Now')
    })
  })
})

async function ensureDownloadFormClient() {
  if (!downloadFormClientPromise) {
    downloadFormClientPromise = import('@components/Forms/Download/client').then(() => undefined)
  }
  return downloadFormClientPromise
}

function getDownloadFormElements() {
  return {
    form: getDownloadFormElement(),
    firstName: getDownloadFirstNameInput(),
    lastName: getDownloadLastNameInput(),
    workEmail: getDownloadWorkEmailInput(),
    jobTitle: getDownloadJobTitleInput(),
    companyName: getDownloadCompanyNameInput(),
  }
}

async function submitFormAndFlush(form: HTMLFormElement) {
  const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
  form.dispatchEvent(submitEvent)
  await new Promise((resolve) => setTimeout(resolve, 0))
}

