import { beforeEach, describe, expect, it } from 'vitest'
import type { MarkdownHeading } from 'astro'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TableOfContents from '@components/Toc/index.astro'
import type { TableOfContentsElement as TableOfContentsElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getTableOfContentsElements } from '../selectors'

type TableOfContentsModule = WebComponentModule<TableOfContentsElementInstance>

describe('TableOfContents selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('Selectors stay in sync with the TableOfContents layout', async () => {
    const headings: MarkdownHeading[] = [
      { depth: 2, slug: 'overview', text: 'Overview' },
      { depth: 3, slug: 'installation', text: 'Installation' },
      { depth: 2, slug: 'usage', text: 'Usage' },
    ]

    await executeRender<TableOfContentsModule>({
      container,
      component: TableOfContents,
      moduleSpecifier: '@components/Toc/client/index',
      args: {
        props: {
          items: headings,
        },
      },
      waitForReady: async (element: TableOfContentsElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        const { toggleButton, overlay, panel, tocLinks } = getTableOfContentsElements(element)

        expect(
          toggleButton,
          'ToC toggle button element with data attribute [data-toc-toggle] not found'
        ).toBeInstanceOf(HTMLButtonElement)
        expect(
          overlay,
          'ToC overlay button element with data attribute [data-toc-overlay] not found'
        ).toBeInstanceOf(HTMLButtonElement)
        expect(panel.tagName, 'ToC panel element with [data-toc-panel] should be a <div>').toBe(
          'DIV'
        )
        expect(
          tocLinks.length,
          'ToC should render at least one link with [data-toc-link]'
        ).toBeGreaterThan(0)
        expect(tocLinks[0], 'First ToC link should be an <a> element').toBeInstanceOf(
          HTMLAnchorElement
        )
      },
    })
  })
})
