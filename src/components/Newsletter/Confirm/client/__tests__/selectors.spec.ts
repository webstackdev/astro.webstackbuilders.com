import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import NewsletterConfirm from '@components/Newsletter/Confirm/index.astro'
import type { NewsletterConfirmElement as NewsletterConfirmElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getNewsletterConfirmElements } from '../selectors'

type NewsletterConfirmModule = WebComponentModule<NewsletterConfirmElementInstance>

type ActionResult<TData> = { data?: TData; error?: { message?: string } }

type ConfirmActionData = {
  success?: boolean
  email?: string
  status?: string
  message?: string
}

const confirmMock = vi.fn<
  (_input: { token: string }) => Promise<ActionResult<ConfirmActionData>>
>()

vi.mock('astro:actions', () => ({
  actions: {
    newsletter: {
      confirm: confirmMock,
    },
  },
}))

describe('NewsletterConfirm selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    confirmMock.mockReset()
    confirmMock.mockResolvedValue({ data: { success: true, email: 'test@example.com' } })
  })

  it('stays in sync with the NewsletterConfirm layout', async () => {
    await executeRender<NewsletterConfirmModule>({
      container,
      component: NewsletterConfirm,
      moduleSpecifier: '@components/Newsletter/Confirm/client/index',
      args: {
        props: {
          token: 'unit-test-token',
        },
      },
      waitForReady: async (element: NewsletterConfirmElementInstance) => {
        element.initialize()
      },
      assert: async ({ element }) => {
        const elements = getNewsletterConfirmElements(element)

        expect(elements.loadingState.id).toBe('loading-state')
        expect(elements.successState.id).toBe('success-state')
        expect(elements.expiredState.id).toBe('expired-state')
        expect(elements.errorState.id).toBe('error-state')
        expect(elements.statusAnnouncer.id).toBe('confirmation-status')
        expect(elements.userEmail.id).toBe('user-email')
        expect(elements.errorTitle.id).toBe('error-title')
        expect(elements.errorMessage.id).toBe('error-message')
        expect(elements.errorDetails.id).toBe('error-details')

        expect(elements.loadingHeading.tagName).toBe('H2')
        expect(elements.successHeading.tagName).toBe('H2')
        expect(elements.expiredHeading.tagName).toBe('H2')
      },
    })
  })
})
