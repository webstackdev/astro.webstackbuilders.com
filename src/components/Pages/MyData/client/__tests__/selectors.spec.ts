import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import PrivacyForm from '@components/Pages/MyData/index.astro'
import type { PrivacyFormElement as PrivacyFormElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getPrivacyFormElements } from '../selectors'

type PrivacyFormModule = WebComponentModule<PrivacyFormElementInstance>

type ActionResult<TData> = { data?: TData; error?: { message?: string } }

const requestDataMock = vi.fn<
  (_input: { email: string; requestType: 'ACCESS' | 'DELETE' }) => Promise<ActionResult<{ message: string }>>
>()

const verifyDsarMock = vi.fn<(_input: { token: string }) => Promise<ActionResult<{ status: string }>>>()

const myDataContent = {
  header: {
    title: 'My Data & Privacy Rights',
    description: 'Under GDPR, you have the right to access and control your personal data.',
  },
  intro: 'Review your rights and submit a request for access or deletion of your personal data.',
  introLinks: {
    privacyPolicyText: 'Privacy Policy',
    consentPreferencesText: 'Consent Preferences',
  },
  accessData: {
    heading: 'Access your data',
    description: 'Submit your email to receive a secure access link.',
    label: 'Email address',
    buttonText: 'Request access',
  },
  deleteData: {
    heading: 'Delete your data',
    description: 'Submit a deletion request for your account data.',
    label: 'Email address',
    buttonText: 'Request deletion',
    confirmText: 'I understand this action is irreversible.',
  },
  next: {
    heading: 'What happens next',
    items: [
      {
        lead: 'Verification',
        text: 'We verify request ownership before processing.',
      },
      {
        lead: 'Response',
        text: 'You receive follow-up instructions by email.',
      },
    ],
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

describe('PrivacyForm selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    requestDataMock.mockReset()
    verifyDsarMock.mockReset()
  })

  it('stays in sync with the PrivacyForm layout', async () => {
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

        expect(elements.accessForm.id).toBe('access-form')
        expect(elements.accessEmailInput.id).toBe('access-email')
        expect(elements.accessMessage.id).toBe('access-message')

        expect(elements.deleteForm.id).toBe('delete-form')
        expect(elements.deleteEmailInput.id).toBe('delete-email')
        expect(elements.deleteConfirmCheckbox.id).toBe('confirm-delete')
        expect(elements.deleteMessage.id).toBe('delete-message')

        expect(elements.accessEmailInput.tagName).toBe('INPUT')
        expect(elements.deleteEmailInput.tagName).toBe('INPUT')
      },
    })
  })
})
