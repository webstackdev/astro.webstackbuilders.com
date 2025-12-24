import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MarkdownHeading } from 'astro'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TableOfContentsFixture from '@components/Toc/client/__fixtures__/toc.fixture.astro'
import type { TocFixtureProps } from '@components/Toc/client/__fixtures__/toc.fixture.types'
import type { TableOfContentsElement } from '@components/Toc/client'
import type { VisibilityListener, VisibilityState } from '@components/scripts/store/tableOfContents'
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

vi.mock('@components/scripts/store/tableOfContents', () => ({
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
  tableOfContentsVisible: false,
  tableOfContentsEnabled: true,
}

type TableOfContentsModule = WebComponentModule<TableOfContentsElement>

const emitVisibilityState = (overrides: Partial<VisibilityState> = {}) => {
  const nextState = { ...baseVisibilityState, ...overrides }
  visibilityListeners.forEach(listener => listener(nextState))
}

const renderTableOfContents = async (
  assertion: (_ctx: { root: TableOfContentsElement; window: Window }) => Promise<void> | void,
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
    assert: async ({ element, window }) => {
      await assertion({ root: element as TableOfContentsElement, window: window as unknown as Window })
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
      expect(toggleButton?.getAttribute('aria-pressed')).toBeNull()
      expect(toggleButton?.getAttribute('aria-label')).toBe('Table of contents')
      expect(overlay?.hasAttribute('disabled')).toBe(true)
      expect(overlay?.tabIndex).toBe(-1)

      emitVisibilityState({ tableOfContentsVisible: true })
      await root.updateComplete

      expect(root.hasAttribute('data-open')).toBe(true)
      expect(panel?.getAttribute('data-state')).toBe('open')
      expect(overlay?.getAttribute('data-visible')).toBe('true')
      expect(toggleButton?.getAttribute('aria-expanded')).toBe('true')
      expect(overlay?.hasAttribute('disabled')).toBe(false)
      expect(overlay?.tabIndex).toBe(0)
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

  it('closes with Escape and restores focus to the toggle', async () => {
    await renderTableOfContents(async ({ root, window }) => {
      const toggleButton = root.querySelector('[data-toc-toggle]') as HTMLButtonElement | null
      const panel = root.querySelector('[data-toc-panel]') as HTMLDivElement | null
      const firstLink = root.querySelector('[data-toc-link]') as HTMLAnchorElement | null

      expect(toggleButton).toBeTruthy()
      expect(panel).toBeTruthy()
      expect(firstLink).toBeTruthy()

      toggleButton?.focus()
      expect(window.document.activeElement).toBe(toggleButton)

      emitVisibilityState({ tableOfContentsVisible: true })
      await root.updateComplete

      expect(window.document.activeElement).toBe(firstLink)

      const KeyboardEventCtor = (window as unknown as { KeyboardEvent: typeof KeyboardEvent }).KeyboardEvent
      const escapeEvent = new KeyboardEventCtor('keyup', { key: 'Escape', bubbles: true })
      panel?.dispatchEvent(escapeEvent)
      expect(hideTableOfContents).toHaveBeenCalledTimes(1)

      emitVisibilityState({ tableOfContentsVisible: false })
      await root.updateComplete

      expect(window.document.activeElement).toBe(toggleButton)
    })
  })

  it('closes the mobile panel when clicking a toc link', async () => {
    await renderTableOfContents(async ({ root }) => {
      const firstLink = root.querySelector('[data-toc-link]') as HTMLAnchorElement | null
      expect(firstLink).toBeTruthy()

      emitVisibilityState({ tableOfContentsVisible: true })
      await root.updateComplete

      firstLink?.click()
      expect(hideTableOfContents).toHaveBeenCalledTimes(1)
    })
  })

  it('applies aria-current and current styling for the active heading', async () => {
    const observers: Array<{
      callback: IntersectionObserverCallback
      observed: Element[]
    }> = []

    await withJsdomEnvironment(async ({ window }) => {
      window.IntersectionObserver = class {
        readonly callback: IntersectionObserverCallback
        readonly observed: Element[] = []

        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback
          observers.push({ callback, observed: this.observed })
        }

        observe = (target: Element) => {
          this.observed.push(target)
        }

        unobserve = () => undefined

        disconnect = () => undefined
      } as unknown as typeof IntersectionObserver
    })

    await renderTableOfContents(async ({ root, window }) => {
      const links = Array.from(root.querySelectorAll('[data-toc-link]')) as HTMLAnchorElement[]
      expect(links).toHaveLength(defaultHeadings.length)
      expect(observers).toHaveLength(1)

      const usageHeading = window.document.getElementById('usage')
      expect(usageHeading).toBeTruthy()

      observers[0]?.callback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: usageHeading as Element,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      )

      const usageLink = links.find(link => link.dataset['tocSlug'] === 'usage')
      expect(usageLink?.getAttribute('aria-current')).toBe('location')
      expect(usageLink?.getAttribute('data-current')).toBe('true')

      const otherLink = links.find(link => link.dataset['tocSlug'] === 'overview')
      expect(otherLink?.getAttribute('aria-current')).toBeNull()
      expect(otherLink?.getAttribute('data-current')).toBe('false')
    })
  })
})
