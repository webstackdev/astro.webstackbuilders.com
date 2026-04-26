import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SearchResultsFixture from '@components/Search/SearchResults/client/__fixtures__/index.fixture.astro'
import type { SearchResultsElement as SearchResultsElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type SearchResultsModule = WebComponentModule<SearchResultsElementInstance>

type ActionResult<TData> = {
  data?: TData
  error?: { code?: string; message?: string; status?: number }
}

const searchQueryMock =
  vi.fn<
    (_input: {
      q: string
      limit?: number
    }) => Promise<ActionResult<{ hits: { title: string; url: string; snippet?: string }[] }>>
  >()
const handleScriptErrorMock = vi.hoisted(() => vi.fn())

vi.mock('astro:actions', () => ({
  actions: {
    search: {
      query: searchQueryMock,
    },
  },
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: handleScriptErrorMock,
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
    handleScriptErrorMock.mockReset()
  })

  const runComponentRender = async (
    props: {
      query?: string
      limit?: number
      showSearchBar?: boolean
      hideSearchEmptyState?: boolean
      resultsMetaOverride?: string
      syncQueryToLocation?: boolean
    },
    assertion: (_context: {
      element: SearchResultsElementInstance
      window: Window & typeof globalThis
    }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<SearchResultsModule>({
      container,
      component: SearchResultsFixture,
      moduleSpecifier: '@components/Search/SearchResults/client/index',
      args: { props },
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
    await runComponentRender({ query: 'a' }, async ({ element }) => {
      await flushMicrotasks()

      expect(searchQueryMock).not.toHaveBeenCalled()

      const meta = element.querySelector('[data-search-meta]')
      expect(meta?.textContent).toBe('Type at least 2 characters to search.')

      const results = element.querySelectorAll('[data-search-results] li')
      expect(results.length).toBe(0)

      const emptyState = element.querySelector('[data-search-empty-state]')
      expect(emptyState?.classList.contains('hidden')).toBe(false)
    })
  })

  it('shows the empty state when there is no query', async () => {
    await runComponentRender({ query: '' }, async ({ element }) => {
      await flushMicrotasks()

      expect(searchQueryMock).not.toHaveBeenCalled()

      const meta = element.querySelector('[data-search-meta]')
      expect(meta?.textContent).toBe('')

      const emptyState = element.querySelector('[data-search-empty-state]')
      expect(emptyState?.classList.contains('hidden')).toBe(false)
    })
  })

  it('queries and renders search hits', async () => {
    searchQueryMock.mockResolvedValue({
      data: {
        hits: [
          {
            title: 'TypeScript Best Practices',
            url: '/articles/typescript-best-practices',
            snippet: '...',
          },
          { title: 'Services', url: '/services', snippet: '...' },
        ],
      },
    })

    await runComponentRender({ query: 'typescript' }, async ({ element }) => {
      await flushMicrotasks()

      expect(searchQueryMock).toHaveBeenCalledWith({ q: 'typescript', limit: 20 })

      const links = Array.from(
        element.querySelectorAll('[data-search-results] a')
      ) as HTMLAnchorElement[]
      expect(
        links.some(link => link.getAttribute('href') === '/articles/typescript-best-practices')
      ).toBe(true)

      const meta = element.querySelector('[data-search-meta]')
      expect(meta?.textContent).toContain('result')

      const emptyState = element.querySelector('[data-search-empty-state]')
      expect(emptyState?.classList.contains('hidden')).toBe(true)

      const itemMeta = element.querySelector('[data-search-results] li div')
      expect(itemMeta?.textContent).toContain('Article')
      expect(itemMeta?.textContent).toContain('/articles/typescript-best-practices')
    })
  })

  it('updates the page results as the user types in the inline search input', async () => {
    vi.useFakeTimers()

    searchQueryMock.mockResolvedValue({
      data: {
        hits: [
          {
            title: 'TypeScript Best Practices',
            url: '/articles/typescript-best-practices',
            snippet: '...',
          },
        ],
      },
    })

    await runComponentRender({ query: '' }, async ({ element, window }) => {
      const input = element.querySelector('[data-search-input]') as HTMLInputElement | null
      expect(input).toBeTruthy()

      input!.value = 'typescript'
      input!.dispatchEvent(new window.Event('input', { bubbles: true }))

      await vi.advanceTimersByTimeAsync(260)
      await flushMicrotasks()

      expect(searchQueryMock).toHaveBeenCalledWith({ q: 'typescript', limit: 20 })

      const links = Array.from(
        element.querySelectorAll('[data-search-results] a')
      ) as HTMLAnchorElement[]
      expect(
        links.some(link => link.getAttribute('href') === '/articles/typescript-best-practices')
      ).toBe(true)

      const emptyState = element.querySelector('[data-search-empty-state]')
      expect(emptyState?.classList.contains('hidden')).toBe(true)
    })

    vi.useRealTimers()
  })

  it('shows the empty state when the search returns no hits', async () => {
    searchQueryMock.mockResolvedValue({
      data: {
        hits: [],
      },
    })

    await runComponentRender({ query: 'typescript' }, async ({ element }) => {
      await flushMicrotasks()

      const results = element.querySelectorAll('[data-search-results] li')
      expect(results.length).toBe(0)

      const emptyState = element.querySelector('[data-search-empty-state]')
      expect(emptyState?.classList.contains('hidden')).toBe(false)
    })
  })

  it('silently ignores forbidden action results', async () => {
    searchQueryMock.mockResolvedValue({
      error: {
        code: 'FORBIDDEN',
        message: 'HTTP Client Error with status code: 403',
        status: 403,
      },
    })

    await runComponentRender({ query: 'blocked' }, async ({ element }) => {
      await flushMicrotasks()

      expect(handleScriptErrorMock).not.toHaveBeenCalled()
      expect(element.querySelector('[data-search-results] li')).toBeNull()

      const error = element.querySelector('[data-search-error]')
      expect(error?.classList.contains('hidden')).toBe(true)
    })
  })

  it('silently ignores forbidden thrown action errors', async () => {
    searchQueryMock.mockRejectedValue(new Error('HTTP Client Error with status code: 403'))

    await runComponentRender({ query: 'blocked' }, async ({ element }) => {
      await flushMicrotasks()

      expect(handleScriptErrorMock).not.toHaveBeenCalled()
      expect(element.querySelector('[data-search-results] li')).toBeNull()

      const error = element.querySelector('[data-search-error]')
      expect(error?.classList.contains('hidden')).toBe(true)
    })
  })

  it('supports a custom limit without rendering the built-in empty state', async () => {
    searchQueryMock.mockResolvedValue({
      data: {
        hits: [],
      },
    })

    await runComponentRender(
      {
        query: 'typescript',
        limit: 4,
        showSearchBar: false,
        hideSearchEmptyState: true,
      },
      async ({ element }) => {
        await flushMicrotasks()

        expect(searchQueryMock).toHaveBeenCalledWith({ q: 'typescript', limit: 4 })
        expect(element.querySelector('[data-search-empty-state]')).toBeNull()
      }
    )
  })

  it('shows the override meta only when results are returned', async () => {
    searchQueryMock.mockResolvedValueOnce({
      data: {
        hits: [],
      },
    })

    await runComponentRender(
      {
        query: 'typescript',
        limit: 4,
        showSearchBar: false,
        hideSearchEmptyState: true,
        resultsMetaOverride: 'Maybe one of these is what you were looking for.',
      },
      async ({ element }) => {
        await flushMicrotasks()

        const meta = element.querySelector('[data-search-meta]')
        expect(meta?.classList.contains('hidden')).toBe(true)
        expect(meta?.textContent).toBe('')
      }
    )

    searchQueryMock.mockResolvedValueOnce({
      data: {
        hits: [
          {
            title: 'TypeScript Best Practices',
            url: '/articles/typescript-best-practices',
            snippet: '...',
          },
        ],
      },
    })

    await runComponentRender(
      {
        query: 'typescript',
        limit: 4,
        showSearchBar: false,
        hideSearchEmptyState: true,
        resultsMetaOverride: 'Maybe one of these is what you were looking for.',
      },
      async ({ element }) => {
        await flushMicrotasks()

        const meta = element.querySelector('[data-search-meta]')
        expect(meta?.classList.contains('hidden')).toBe(false)
        expect(meta?.textContent).toBe('Maybe one of these is what you were looking for.')
      }
    )
  })

  it('does not append a q parameter when URL syncing is disabled', async () => {
    searchQueryMock.mockResolvedValue({
      data: {
        hits: [],
      },
    })

    await runComponentRender(
      {
        query: 'some article',
        showSearchBar: false,
        hideSearchEmptyState: true,
        syncQueryToLocation: false,
      },
      async ({ window }) => {
        const initialSearch = window.location.search
        await flushMicrotasks()

        expect(window.location.search).toBe(initialSearch)
      }
    )
  })

  it('seeds the initial query from the location when the rendered input starts empty', async () => {
    searchQueryMock.mockResolvedValue({
      data: {
        hits: [
          {
            title: 'Astro Search',
            url: '/articles/astro-search',
            snippet: '...',
          },
        ],
      },
    })

    await runComponentRender({ query: '' }, async ({ element, window }) => {
      window.history.replaceState(window.history.state, '', '/search?q=astro')

      await (element as unknown as { run: () => Promise<void> }).run()
      await flushMicrotasks()

      const input = element.querySelector('[data-search-input]') as HTMLInputElement | null
      expect(input?.value).toBe('astro')
      expect(searchQueryMock).toHaveBeenCalledWith({ q: 'astro', limit: 20 })
    })
  })
})
