import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import PrivacyForm from '@components/Pages/MyData/index.astro'
import type { PrivacyFormElement as PrivacyFormElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getPrivacyFormElements } from '../selectors'

type PrivacyFormModule = WebComponentModule<PrivacyFormElementInstance>

type ActionResult<TData> = { data?: TData; error?: { message?: string } }

type VerifyResult =
  | { status: 'download'; filename: string; json: string }
  | { status: 'deleted' }
  | { status: 'expired' }

const requestDataMock = vi.fn<
  (_input: { email: string; requestType: 'ACCESS' | 'DELETE' }) => Promise<ActionResult<{ message: string }>>
>()

const verifyDsarMock = vi.fn<(_input: { token: string }) => Promise<ActionResult<VerifyResult>>>()

const myDataContent = {
  header: {
    title: 'My Data & Privacy Rights',
    description: 'Under GDPR, you have the right to access and control your personal data.',
  },
  introLinks: {
    privacyPolicyText: 'Privacy Policy',
    consentPreferencesText: 'Consent Preferences',
  },
}

vi.mock('astro:actions', () => ({
  actions: {
    gdpr: {
      requestData: requestDataMock,
      verifyDsar: verifyDsarMock,
    },
  },
}))

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

describe('PrivacyForm behavior', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    requestDataMock.mockReset()
    verifyDsarMock.mockReset()
  })

  it('submits an access request and shows success', async () => {
    requestDataMock.mockResolvedValue({ data: { message: 'Access request sent.' } })

    await executeRender<PrivacyFormModule>({
      container,
      component: PrivacyForm,
      moduleSpecifier: '@components/Pages/MyData/client/index',
      args: {
        props: {
          content: myDataContent,
        },
      },
      waitForReady: async (element: PrivacyFormElementInstance) => {
        window.history.replaceState({}, '', 'http://localhost/privacy/my-data')
        element.initialize()
      },
      assert: async ({ element }) => {
        const elements = getPrivacyFormElements(element)
        elements.accessEmailInput.value = 'test@example.com'

        elements.accessForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        await flushMicrotasks()

        expect(requestDataMock).toHaveBeenCalledWith({ email: 'test@example.com', requestType: 'ACCESS' })
        expect(elements.accessMessage.textContent).toBe('Access request sent.')
        expect(elements.accessMessage.classList.contains('hidden')).toBe(false)
        expect(elements.accessMessage.classList.contains('border-success')).toBe(true)
        expect(elements.accessEmailInput.value).toBe('')
      },
    })
  })

  it('blocks delete submit when confirmation is not checked', async () => {
    requestDataMock.mockResolvedValue({ data: { message: 'Delete request sent.' } })

    await executeRender<PrivacyFormModule>({
      container,
      component: PrivacyForm,
      moduleSpecifier: '@components/Pages/MyData/client/index',
      args: {
        props: {
          content: myDataContent,
        },
      },
      waitForReady: async (element: PrivacyFormElementInstance) => {
        window.history.replaceState({}, '', 'http://localhost/privacy/my-data')
        element.initialize()
      },
      assert: async ({ element }) => {
        const elements = getPrivacyFormElements(element)
        elements.deleteEmailInput.value = 'test@example.com'
        elements.deleteConfirmCheckbox.checked = false

        elements.deleteForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        await flushMicrotasks()

        expect(requestDataMock).not.toHaveBeenCalled()
        expect(elements.deleteMessage.textContent).toBe('Please confirm you understand the deletion request.')
        expect(elements.deleteMessage.classList.contains('border-danger')).toBe(true)
      },
    })
  })

  it('verifies token, downloads JSON, then redirects', async () => {
    verifyDsarMock.mockResolvedValue({
      data: { status: 'download', filename: 'dsar.json', json: '{"ok":true}' },
    })

    const downloadJsonSpy = vi.fn()
    const navigateToSpy = vi.fn()

    await executeRender<PrivacyFormModule>({
      container,
      component: PrivacyForm,
      moduleSpecifier: '@components/Pages/MyData/client/index',
      args: {
        props: {
          content: myDataContent,
        },
      },
      waitForReady: async (element: PrivacyFormElementInstance) => {
        window.history.replaceState({}, '', 'http://localhost/privacy/my-data?token=unit-test-token')
        ;(element as unknown as { downloadJson: typeof downloadJsonSpy }).downloadJson = downloadJsonSpy
        ;(element as unknown as { navigateTo: typeof navigateToSpy }).navigateTo = navigateToSpy
        element.initialize()
      },
      assert: async () => {
        await flushMicrotasks()

        expect(verifyDsarMock).toHaveBeenCalledWith({ token: 'unit-test-token' })
        expect(downloadJsonSpy).toHaveBeenCalledWith('dsar.json', '{"ok":true}')
        expect(navigateToSpy).toHaveBeenCalledWith('/privacy/my-data?status=already-completed')
      },
    })
  })
})
