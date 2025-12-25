import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SearchResultsFixture from '@components/Search/SearchResults/client/__fixtures__/index.fixture.astro'
import type { SearchResultsElement as SearchResultsElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type SearchResultsModule = WebComponentModule<SearchResultsElementInstance>

type ActionResult<TData> = { data?: TData; error?: { message?: string } }

const searchQueryMock = vi.fn<
  (_input: { q: string; limit?: number }) => Promise<ActionResult<{ hits: { title: string; url: string; snippet?: string }[] }>>
>()

vi.mock('astro:actions', () => ({
  actions: {
    search: {
      query: searchQueryMock,
    },
  },
}))

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('SearchResults web component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    searchQueryMock.mockReset()
  })

  const runComponentRender = async (
    query: string,
    assertion: (_context: { element: SearchResultsElementInstance; window: Window & typeof globalThis }) => Promise<void> | void,
  ): Promise<void> => {
    await executeRender<SearchResultsModule>({
      container,
      component: SearchResultsFixture,
      moduleSpecifier: '@components/Search/SearchResults/client/index',
      args: { props: { query } },
      waitForReady: async (element: SearchResultsElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        if (!window) {
          throw new Error('Missing JSDOM window for SearchResults test.')
        }
        await assertion({ element, window })
      },
    })
  }

  it('shows the short-query hint and does not call search', async () => {
    await runComponentRender('a', async ({ element }) => {
      await flushMicrotasks()

      expect(searchQueryMock).not.toHaveBeenCalled()

      const meta = element.querySelector('[data-search-meta]')
      expect(meta?.textContent).toBe('Type at least 2 characters to search.')

      const results = element.querySelectorAll('[data-search-results] li')
      expect(results.length).toBe(0)
    })
  })

  it('queries and renders search hits', async () => {
    searchQueryMock.mockResolvedValue({
      data: {
        hits: [
          { title: 'TypeScript Best Practices', url: '/articles/typescript-best-practices', snippet: '...' },
          { title: 'Services', url: '/services', snippet: '...' },
        ],
      },
    })

    await runComponentRender('typescript', async ({ element }) => {
      await flushMicrotasks()

      expect(searchQueryMock).toHaveBeenCalledWith({ q: 'typescript', limit: 20 })

      const links = Array.from(element.querySelectorAll('[data-search-results] a')) as HTMLAnchorElement[]
      expect(links.some(link => link.getAttribute('href') === '/articles/typescript-best-practices')).toBe(true)

      const meta = element.querySelector('[data-search-meta]')
      expect(meta?.textContent).toContain('result')
    })
  })
})
