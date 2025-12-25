import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SearchBarFixture from '@components/Search/SearchBar/client/__fixtures__/index.fixture.astro'
import type { SearchBarElement as SearchBarElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type SearchBarModule = WebComponentModule<SearchBarElementInstance>

type ActionResult<TData> = { data?: TData; error?: { message?: string } }

const searchQueryMock = vi.fn<
  (_input: { q: string; limit?: number }) => Promise<ActionResult<{ hits: { title: string; url: string }[] }>>
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

describe('SearchBar web component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    searchQueryMock.mockReset()
  })

  const runComponentRender = async (
    assertion: (_context: { element: SearchBarElementInstance; window: Window & typeof globalThis }) => Promise<void> | void,
  ): Promise<void> => {
    await executeRender<SearchBarModule>({
      container,
      component: SearchBarFixture,
      moduleSpecifier: '@components/Search/SearchBar/client/index',
      waitForReady: async (element: SearchBarElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        if (!window) {
          throw new Error('Missing JSDOM window for SearchBar test.')
        }
        await assertion({ element, window })
      },
    })
  }

  it('hides results when query is too short', async () => {
    await runComponentRender(async ({ element, window }) => {
      const input = element.querySelector('[data-search-input]') as HTMLInputElement
      const resultsContainer = element.querySelector('[data-search-results]') as HTMLElement

      input.value = 'a'
      input.dispatchEvent(new window.Event('input', { bubbles: true }))
      await flushMicrotasks()

      expect(searchQueryMock).not.toHaveBeenCalled()
      expect(resultsContainer.classList.contains('hidden')).toBe(true)
    })
  })

  it('queries and renders suggestions with debounce', async () => {
    vi.useFakeTimers()

    await runComponentRender(async ({ element, window }) => {
      searchQueryMock.mockResolvedValue({
        data: {
          hits: [
            { title: 'About', url: '/about' },
            { title: 'Services', url: '/services' },
          ],
        },
      })

      const input = element.querySelector('[data-search-input]') as HTMLInputElement
      const resultsContainer = element.querySelector('[data-search-results]') as HTMLElement

      input.value = 'ab'
      input.dispatchEvent(new window.Event('input', { bubbles: true }))

      await vi.advanceTimersByTimeAsync(260)
      await flushMicrotasks()

      expect(searchQueryMock).toHaveBeenCalledWith({ q: 'ab', limit: 8 })
      expect(resultsContainer.classList.contains('hidden')).toBe(false)

      const links = Array.from(element.querySelectorAll('[data-search-results-list] a')) as HTMLAnchorElement[]
      expect(links.some(link => link.getAttribute('href') === '/about')).toBe(true)
      expect(links.some(link => link.getAttribute('href') === '/search?q=ab')).toBe(true)
    })

    vi.useRealTimers()
  })
})
