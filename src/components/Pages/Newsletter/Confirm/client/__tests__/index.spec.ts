import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import NewsletterConfirm from '@components/Pages/Newsletter/Confirm/index.astro'
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

const confirmMock = vi.fn<(_input: { token: string }) => Promise<ActionResult<ConfirmActionData>>>()

vi.mock('astro:actions', () => ({
  actions: {
    newsletter: {
      confirm: confirmMock,
    },
  },
}))

const flushPromises = async () => {
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('NewsletterConfirmElement web component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    confirmMock.mockReset()
    container = await AstroContainer.create()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderConfirm = async (
    assertion: (_context: {
      element: NewsletterConfirmElementInstance
      elements: ReturnType<typeof getNewsletterConfirmElements>
    }) => Promise<void> | void,
    mockResult: ActionResult<ConfirmActionData>
  ) => {
    confirmMock.mockResolvedValue(mockResult)

    await executeRender<NewsletterConfirmModule>({
      container,
      component: NewsletterConfirm,
      moduleSpecifier: '@components/Pages/Newsletter/Confirm/client/index',
      args: {
        props: {
          token: 'unit-test-token',
        },
      },
      waitForReady: async (element: NewsletterConfirmElementInstance) => {
        element.initialize()
        await flushPromises()
      },
      assert: async ({ element }) => {
        const elements = getNewsletterConfirmElements(element)
        await assertion({ element, elements })
      },
    })
  }

  test('shows success state when confirmation succeeds', async () => {
    await renderConfirm(
      async ({ elements }) => {
        expect(elements.successState.classList.contains('hidden')).toBe(false)
        expect(elements.loadingState.classList.contains('hidden')).toBe(true)
        expect(elements.userEmail.textContent).toBe('test@example.com')
        expect(elements.statusAnnouncer.textContent).toBe('Subscription confirmed.')
      },
      { data: { success: true, email: 'test@example.com' } }
    )
  })

  test('shows expired state when confirmation is expired', async () => {
    await renderConfirm(
      async ({ elements }) => {
        expect(elements.expiredState.classList.contains('hidden')).toBe(false)
        expect(elements.loadingState.classList.contains('hidden')).toBe(true)
        expect(elements.statusAnnouncer.textContent).toBe('Confirmation link expired.')
      },
      { data: { success: false, status: 'expired' } }
    )
  })

  test('uses success magic token and skips API confirmation', async () => {
    await executeRender<NewsletterConfirmModule>({
      container,
      component: NewsletterConfirm,
      moduleSpecifier: '@components/Pages/Newsletter/Confirm/client/index',
      args: {
        props: {
          token: 'success-token',
        },
      },
      waitForReady: async (element: NewsletterConfirmElementInstance) => {
        element.initialize()
        await flushPromises()
      },
      assert: async ({ element }) => {
        const elements = getNewsletterConfirmElements(element)
        expect(element.getAttribute('data-confirm-state')).toBe('success')
        expect(elements.successState.classList.contains('hidden')).toBe(false)
        expect(elements.userEmail.textContent).toBe('preview@example.com')
        expect(confirmMock).not.toHaveBeenCalled()
      },
    })
  })

  test('uses expired magic token and skips API confirmation', async () => {
    await executeRender<NewsletterConfirmModule>({
      container,
      component: NewsletterConfirm,
      moduleSpecifier: '@components/Pages/Newsletter/Confirm/client/index',
      args: {
        props: {
          token: 'expired-token',
        },
      },
      waitForReady: async (element: NewsletterConfirmElementInstance) => {
        element.initialize()
        await flushPromises()
      },
      assert: async ({ element }) => {
        const elements = getNewsletterConfirmElements(element)
        expect(element.getAttribute('data-confirm-state')).toBe('expired')
        expect(elements.expiredState.classList.contains('hidden')).toBe(false)
        expect(confirmMock).not.toHaveBeenCalled()
      },
    })
  })

  test('uses error magic token and skips API confirmation', async () => {
    await executeRender<NewsletterConfirmModule>({
      container,
      component: NewsletterConfirm,
      moduleSpecifier: '@components/Pages/Newsletter/Confirm/client/index',
      args: {
        props: {
          token: 'error-token',
        },
      },
      waitForReady: async (element: NewsletterConfirmElementInstance) => {
        element.initialize()
        await flushPromises()
      },
      assert: async ({ element }) => {
        const elements = getNewsletterConfirmElements(element)
        expect(element.getAttribute('data-confirm-state')).toBe('error')
        expect(elements.errorState.classList.contains('hidden')).toBe(false)
        expect(confirmMock).not.toHaveBeenCalled()
      },
    })
  })

  test('uses loading magic token and skips API confirmation', async () => {
    await executeRender<NewsletterConfirmModule>({
      container,
      component: NewsletterConfirm,
      moduleSpecifier: '@components/Pages/Newsletter/Confirm/client/index',
      args: {
        props: {
          token: 'loading-token',
        },
      },
      waitForReady: async (element: NewsletterConfirmElementInstance) => {
        element.initialize()
        await flushPromises()
      },
      assert: async ({ element }) => {
        const elements = getNewsletterConfirmElements(element)
        expect(element.getAttribute('data-confirm-state')).toBe('loading')
        expect(elements.loadingState.classList.contains('hidden')).toBe(false)
        expect(confirmMock).not.toHaveBeenCalled()
      },
    })
  })
})
