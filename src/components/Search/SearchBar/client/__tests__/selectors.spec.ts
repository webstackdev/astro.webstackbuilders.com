import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SearchBar from '@components/Search/SearchBar/index.astro'
import type { SearchBarElement as SearchBarElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getSearchBarElements } from '../selectors'

type SearchBarModule = WebComponentModule<SearchBarElementInstance>

describe('SearchBar selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the SearchBar layout', async () => {
    await executeRender<SearchBarModule>({
      container,
      component: SearchBar,
      moduleSpecifier: '@components/Search/SearchBar/client/index',
      waitForReady: async (element: SearchBarElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        const { form, input, resultsContainer, resultsList } = getSearchBarElements(element)

        expect(form, 'SearchBar should render a <form> with [data-search-form]').toBeInstanceOf(
          HTMLFormElement
        )
        expect(input, 'SearchBar should render an <input> with [data-search-input]').toBeInstanceOf(
          HTMLInputElement
        )
        expect(
          resultsContainer,
          'SearchBar should render a results container with [data-search-results]'
        ).toBeInstanceOf(HTMLElement)
        expect(
          resultsList.tagName,
          'SearchBar results list with [data-search-results-list] should be a <ul>'
        ).toBe('UL')
      },
    })
  })
})
