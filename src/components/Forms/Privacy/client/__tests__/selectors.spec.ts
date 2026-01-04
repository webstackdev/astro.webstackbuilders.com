import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import PrivacyForm from '@components/Forms/Privacy/index.astro'
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
      moduleSpecifier: '@components/Forms/Privacy/client/index',
      args: {
        props: {
          status: undefined,
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
