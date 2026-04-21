import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import WebMentionsAstro from '@components/WebMentions/index.astro'
import type { WebMentionsElement } from '@components/WebMentions/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type WebMentionsModule = WebComponentModule<WebMentionsElement>

const webmentionsListMock = vi.fn()
const handleScriptErrorMock = vi.fn()

vi.mock('astro:actions', () => ({
  actions: {
    webmentions: {
      list: webmentionsListMock,
    },
  },
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: handleScriptErrorMock,
}))

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('WebMentions web component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    handleScriptErrorMock.mockReset()
    webmentionsListMock.mockReset()
  })

  const runComponentRender = async (
    assertion: (_context: {
      element: WebMentionsElement
      window: Window & typeof globalThis
    }) => Promise<void> | void,
    props?: {
      facepileLimit?: number
      showFacepile?: boolean
      url?: string
    }
  ): Promise<void> => {
    await executeRender<WebMentionsModule>({
      container,
      component: WebMentionsAstro,
      moduleSpecifier: '@components/WebMentions/client/index',
      args: {
        props: {
          url: props?.url ?? 'https://example.com/post',
          showFacepile: props?.showFacepile ?? true,
          facepileLimit: props?.facepileLimit ?? 1,
        },
      },
      waitForReady: async (element: WebMentionsElement) => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        if (!window) {
          throw new Error('Missing JSDOM window for WebMentions test.')
        }
        await assertion({ element, window })
      },
    })
  }

  test('fetches mentions via actions and renders counts, facepile, and content', async () => {
    webmentionsListMock.mockResolvedValue({
      data: {
        likesCount: 1,
        mentions: [
          {
            authorName: 'Alice',
            authorUrl: 'https://elsewhere.example.com/alice',
            avatarUrl: 'https://elsewhere.example.com/alice.jpg',
            contentHtml: '<p>Nice post</p>',
            id: 'mention-1',
            published: '2024-01-01T00:00:00.000Z',
            sourceUrl: 'https://elsewhere.example.com/1',
          },
          {
            authorName: 'Dana',
            authorUrl: 'https://elsewhere.example.com/dana',
            avatarUrl: 'https://elsewhere.example.com/dana.jpg',
            contentHtml: '<p>Replying here</p>',
            id: 'mention-2',
            published: '2024-01-01T01:00:00.000Z',
            sourceUrl: 'https://elsewhere.example.com/1b',
          },
        ],
        repostsCount: 1,
      },
    })

    await runComponentRender(async ({ element }) => {
      await flushMicrotasks()
      await element.updateComplete

      expect(webmentionsListMock).toHaveBeenCalledWith({ url: 'https://example.com/post' })

      const section = element.querySelector('#webmentions')
      expect(section?.getAttribute('aria-labelledby')).toBe('webmentions-heading')

      const likes = element.querySelector('span[aria-label="1 like"]')
      expect(likes).toBeTruthy()

      const reposts = element.querySelector('span[aria-label="1 repost"]')
      expect(reposts).toBeTruthy()

      const facepile = element.querySelector('[aria-label^="Recent mentions:"]')
      expect(facepile?.getAttribute('role')).toBe('group')

      const facepileAvatars = facepile?.querySelectorAll('img[aria-hidden="true"]')
      expect(facepileAvatars?.length).toBeGreaterThan(0)

      const more = facepile?.querySelector('[aria-label="1 more mention"]')
      expect(more).toBeTruthy()

      expect(element.textContent).toContain('Alice')
      expect(element.innerHTML).toContain('<p>Nice post</p>')
    })
  })

  test('renders nothing when the action returns no mentions or interactions', async () => {
    webmentionsListMock.mockResolvedValue({
      data: {
        likesCount: 0,
        mentions: [],
        repostsCount: 0,
      },
    })

    await runComponentRender(
      async ({ element }) => {
        await flushMicrotasks()
        await element.updateComplete

        expect(element.querySelector('#webmentions')).toBeNull()
      },
      { url: 'https://example.com/empty-post' }
    )
  })

  test('fails silently and reports action result errors through the client error handler', async () => {
    const actionError = new Error('Action returned an error result')
    webmentionsListMock.mockResolvedValue({
      data: undefined,
      error: actionError,
    })

    await runComponentRender(
      async ({ element }) => {
        await flushMicrotasks()
        await element.updateComplete

        expect(element.querySelector('#webmentions')).toBeNull()
        expect(handleScriptErrorMock).toHaveBeenCalledWith(actionError, {
          scriptName: 'WebMentionsElement',
          operation: 'load',
        })
      },
      { url: 'https://example.com/error-post' }
    )
  })

  test('fails silently and reports thrown load errors through the client error handler', async () => {
    const thrownError = new Error('Network blew up')
    webmentionsListMock.mockRejectedValue(thrownError)

    await runComponentRender(
      async ({ element }) => {
        await flushMicrotasks()
        await element.updateComplete

        expect(element.querySelector('#webmentions')).toBeNull()
        expect(handleScriptErrorMock).toHaveBeenCalledWith(thrownError, {
          scriptName: 'WebMentionsElement',
          operation: 'load',
        })
      },
      { url: 'https://example.com/thrown-error-post' }
    )
  })
})
