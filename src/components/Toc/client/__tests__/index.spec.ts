import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MarkdownHeading } from 'astro'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TableOfContentsFixture from '@components/Toc/client/__fixtures__/toc.fixture.astro'
import type { TocFixtureProps } from '@components/Toc/client/__fixtures__/toc.fixture.types'
import type { TableOfContentsElement } from '@components/Toc/client'
import type { VisibilityListener, VisibilityState } from '@components/scripts/store/visibility'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

const hideTableOfContents = vi.fn()
const showTableOfContents = vi.fn()
const visibilityListeners: VisibilityListener[] = []

const unsubscribe = (listener: VisibilityListener) => {
  const index = visibilityListeners.indexOf(listener)
  if (index >= 0) {
    visibilityListeners.splice(index, 1)
  }
}

vi.mock('@components/scripts/store/visibility', () => ({
  hideTableOfContents,
  showTableOfContents,
  onVisibilityChange: vi.fn((listener: VisibilityListener) => {
    visibilityListeners.push(listener)
    return () => unsubscribe(listener)
  }),
}))

const defaultHeadings: MarkdownHeading[] = [
  { depth: 2, slug: 'overview', text: 'Overview' },
  { depth: 3, slug: 'installation', text: 'Installation' },
  { depth: 2, slug: 'usage', text: 'Usage' },
]

const baseVisibilityState: VisibilityState = {
  consentBannerVisible: false,
  tableOfContentsVisible: false,
  tableOfContentsEnabled: true,
}

type TableOfContentsModule = WebComponentModule<TableOfContentsElement>

const emitVisibilityState = (overrides: Partial<VisibilityState> = {}) => {
  const nextState = { ...baseVisibilityState, ...overrides }
  visibilityListeners.forEach(listener => listener(nextState))
}

const renderTableOfContents = async (
  assertion: (_ctx: { root: TableOfContentsElement }) => Promise<void> | void,
  headings: MarkdownHeading[] = defaultHeadings,
) => {
  const container = await AstroContainer.create()

  await executeRender<TableOfContentsModule>({
    container,
    component: TableOfContentsFixture,
    moduleSpecifier: '@components/Toc/client/index',
    args: {
      props: {
        headings,
      } satisfies TocFixtureProps,
    },
    assert: async ({ element }) => {
      await assertion({ root: element as TableOfContentsElement })
    },
  })
}

afterEach(() => {
  hideTableOfContents.mockClear()
  showTableOfContents.mockClear()
  visibilityListeners.length = 0
})

describe('TableOfContents web component module', () => {
  it('exposes metadata for registration', async () => {
    await withJsdomEnvironment(async () => {
      const { webComponentModule, TableOfContentsElement: ComponentCtor } = await import('@components/Toc/client')

      expect(webComponentModule.registeredName).toBe('table-of-contents')
      expect(webComponentModule.componentCtor).toBe(ComponentCtor)
    })
  })

  it('registers the custom element when requested', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      const { registerTableOfContentsComponent, TableOfContentsElement: ComponentCtor } = await import(
        '@components/Toc/client'
      )
      const uniqueTag = `table-of-contents-${Math.random().toString(36).slice(2)}`

      const originalGet = window.customElements.get.bind(window.customElements)
      const getSpy = vi
        .spyOn(window.customElements, 'get')
        .mockImplementation(tagName => (tagName === uniqueTag ? undefined : originalGet(tagName)))
      const defineSpy = vi.spyOn(window.customElements, 'define').mockImplementation(() => undefined)

      await registerTableOfContentsComponent(uniqueTag)

      expect(defineSpy).toHaveBeenCalledWith(uniqueTag, ComponentCtor)

      getSpy.mockRestore()
      defineSpy.mockRestore()
    })
  })
})

describe('TableOfContents component rendering', () => {
  it('renders nested headings and responds to store updates', async () => {
    await renderTableOfContents(async ({ root }) => {
      const toggleButton = root.querySelector('[data-toc-toggle]') as HTMLButtonElement | null
      const overlay = root.querySelector('[data-toc-overlay]') as HTMLButtonElement | null
      const panel = root.querySelector('[data-toc-panel]') as HTMLElement | null
      const links = root.querySelectorAll('nav a')

      expect(toggleButton).toBeTruthy()
      expect(overlay).toBeTruthy()
      expect(panel).toBeTruthy()
      expect(links).toHaveLength(defaultHeadings.length)
      expect(panel?.getAttribute('data-state')).toBe('closed')
      expect(root.hasAttribute('data-open')).toBe(false)

      emitVisibilityState({ tableOfContentsVisible: true })
      await root.updateComplete

      expect(root.hasAttribute('data-open')).toBe(true)
      expect(panel?.getAttribute('data-state')).toBe('open')
      expect(overlay?.getAttribute('data-visible')).toBe('true')
      expect(toggleButton?.getAttribute('aria-expanded')).toBe('true')
    })
  })

  it('invokes store actions when interacting with controls', async () => {
    await renderTableOfContents(async ({ root }) => {
      const toggleButton = root.querySelector('[data-toc-toggle]') as HTMLButtonElement | null
      const overlay = root.querySelector('[data-toc-overlay]') as HTMLButtonElement | null

      expect(toggleButton).toBeTruthy()
      expect(overlay).toBeTruthy()
      emitVisibilityState({ tableOfContentsVisible: false, tableOfContentsEnabled: true })
      await root.updateComplete

      toggleButton?.click()
      expect(showTableOfContents).toHaveBeenCalledTimes(1)

      emitVisibilityState({ tableOfContentsVisible: true, tableOfContentsEnabled: true })
      await root.updateComplete
      toggleButton?.click()
      expect(hideTableOfContents).toHaveBeenCalledTimes(1)

      overlay?.click()
      expect(hideTableOfContents).toHaveBeenCalledTimes(2)
    })
  })
})
