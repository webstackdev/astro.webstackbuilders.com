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

        expect(form).toBeInstanceOf(HTMLFormElement)
        expect(input).toBeInstanceOf(HTMLInputElement)
        expect(resultsContainer).toBeInstanceOf(HTMLElement)
        expect(resultsList.tagName).toBe('UL')
      },
    })
  })
})
