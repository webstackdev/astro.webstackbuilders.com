import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SearchResults from '@components/Search/SearchResults/index.astro'
import type { SearchResultsElement as SearchResultsElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getSearchResultsElements } from '../selectors'

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

describe('SearchResults selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    searchQueryMock.mockReset()
  })

  it('stays in sync with the SearchResults layout', async () => {
    await executeRender<SearchResultsModule>({
      container,
      component: SearchResults,
      moduleSpecifier: '@components/Search/SearchResults/client/index',
      args: { props: { query: '' } },
      waitForReady: async (element: SearchResultsElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        const { meta, error, resultsList, input } = getSearchResultsElements(element)

        expect(meta, 'SearchResults should render a meta <p> with [data-search-meta]').toBeInstanceOf(
          HTMLParagraphElement,
        )
        expect(error, 'SearchResults should render an error <p> with [data-search-error]').toBeInstanceOf(
          HTMLParagraphElement,
        )
        expect(resultsList.tagName, 'SearchResults list with ol[data-search-results] should be an <ol>').toBe(
          'OL',
        )
        expect(input, 'SearchResults should include a search input with [data-search-input]').toBeInstanceOf(
          HTMLInputElement,
        )
      },
    })
  })
})
