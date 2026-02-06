import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SearchBarFixture from '@components/Search/SearchBar/client/__fixtures__/index.fixture.astro'
import SearchBarHeaderFixture from '@components/Search/SearchBar/client/__fixtures__/header.fixture.astro'
import type { SearchBarElement as SearchBarElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { __resetHeaderSearchForTests } from '@components/scripts/store/search'

type SearchBarModule = WebComponentModule<SearchBarElementInstance>

type ActionResult<TData> = { data?: TData; error?: { message?: string } }

const searchQueryMock =
  vi.fn<
    (_input: {
      q: string
      limit?: number
    }) => Promise<ActionResult<{ hits: { title: string; url: string }[] }>>
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

  class MockSpeechRecognition {
    public continuous = false
    public interimResults = false
    public lang = 'en-US'

    public onstart: (() => void) | null = null
    public onend: (() => void) | null = null
    public onerror: ((_event: { error: string }) => void) | null = null
    public onresult: ((_event: unknown) => void) | null = null

    public start = vi.fn(() => {
      this.onstart?.()
    })

    public stop = vi.fn(() => {
      this.onend?.()
    })
  }

  beforeEach(async () => {
    container = await AstroContainer.create()
    searchQueryMock.mockReset()

    __resetHeaderSearchForTests()

    delete (globalThis as unknown as Record<string, unknown>)['SpeechRecognition']
    delete (globalThis as unknown as Record<string, unknown>)['webkitSpeechRecognition']
  })

  const runComponentRender = async (
    assertion: (_context: {
      element: SearchBarElementInstance
      window: Window & typeof globalThis
    }) => Promise<void> | void
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

  const runHeaderComponentRender = async (
    assertion: (_context: {
      element: SearchBarElementInstance
      window: Window & typeof globalThis
    }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<SearchBarModule>({
      container,
      component: SearchBarHeaderFixture,
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

      const links = Array.from(
        element.querySelectorAll('[data-search-results-list] a')
      ) as HTMLAnchorElement[]
      expect(links.some(link => link.getAttribute('href') === '/about')).toBe(true)
      expect(links.some(link => link.getAttribute('href') === '/search?q=ab')).toBe(true)
    })

    vi.useRealTimers()
  })

  it('toggles open and closes on Escape in header variant', async () => {
    await runHeaderComponentRender(async ({ element, window }) => {
      const toggleBtn = element.querySelector('[data-search-toggle]') as HTMLButtonElement
      const input = element.querySelector('[data-search-input]') as HTMLInputElement
      const clearBtn = element.querySelector('[data-search-clear]') as HTMLButtonElement

      expect(toggleBtn.getAttribute('aria-expanded')).toBe('false')
      expect(input.classList.contains('hidden')).toBe(true)
      expect(toggleBtn.hasAttribute('hidden')).toBe(false)
      expect(clearBtn.hasAttribute('hidden')).toBe(true)

      toggleBtn.click()
      await flushMicrotasks()

      expect(toggleBtn.getAttribute('aria-expanded')).toBe('true')
      expect(input.classList.contains('hidden')).toBe(false)
      expect(toggleBtn.hasAttribute('hidden')).toBe(true)
      expect(clearBtn.hasAttribute('hidden')).toBe(false)

      input.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Escape', bubbles: true }))
      await flushMicrotasks()

      expect(toggleBtn.getAttribute('aria-expanded')).toBe('false')
      expect(input.classList.contains('hidden')).toBe(true)
      expect(toggleBtn.hasAttribute('hidden')).toBe(false)
      expect(clearBtn.hasAttribute('hidden')).toBe(true)
    })
  })

  it('shows a custom clear button and clears the query in header variant', async () => {
    await runHeaderComponentRender(async ({ element, window }) => {
      const toggleBtn = element.querySelector('[data-search-toggle]') as HTMLButtonElement
      const input = element.querySelector('[data-search-input]') as HTMLInputElement
      const clearBtn = element.querySelector('[data-search-clear]') as HTMLButtonElement
      const micBtn = element.querySelector('[data-search-mic]') as HTMLButtonElement

      expect(clearBtn.hasAttribute('hidden')).toBe(true)
      expect(micBtn.hasAttribute('hidden')).toBe(true)

      toggleBtn.click()
      await flushMicrotasks()

      input.value = 'ab'
      input.dispatchEvent(new window.Event('input', { bubbles: true }))
      await flushMicrotasks()

      expect(clearBtn.hasAttribute('hidden')).toBe(false)
      // Mic stays hidden unless the browser supports speech recognition.
      expect(micBtn.hasAttribute('hidden')).toBe(true)

      clearBtn.click()
      await flushMicrotasks()

      expect(input.value).toBe('')
      // Still open; button switches to "Close search" mode.
      expect(clearBtn.hasAttribute('hidden')).toBe(false)
    })
  })

  it('fills the query from speech recognition when available', async () => {
    await runHeaderComponentRender(async ({ element, window }) => {
      ;(window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = MockSpeechRecognition as unknown
      ;(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition =
        MockSpeechRecognition as unknown

      const toggleBtn = element.querySelector('[data-search-toggle]') as HTMLButtonElement
      const input = element.querySelector('[data-search-input]') as HTMLInputElement
      const micBtn = element.querySelector('[data-search-mic]') as HTMLButtonElement

      toggleBtn.click()
      await flushMicrotasks()

      micBtn.click()
      await flushMicrotasks()

      // Simulate a recognition result.
      const recognition = (element as unknown as { speechRecognition?: MockSpeechRecognition }).speechRecognition
      expect(recognition).toBeTruthy()

      recognition?.onresult?.({
        resultIndex: 0,
        results: [[{ transcript: 'hello world' }]],
      } as unknown)

      await flushMicrotasks()
      expect(input.value).toBe('hello world')
    })
  })
})
