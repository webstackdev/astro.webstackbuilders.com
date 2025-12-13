import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import ThemePickerFixture from '@components/ThemePicker/client/__fixtures__/index.fixture.astro'
import type { ThemePickerFixtureProps } from '@components/ThemePicker/client/__fixtures__/index.fixture.types'
import type { ThemePickerElement } from '@components/ThemePicker/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

vi.mock(
  '@components/Icon/index.astro',
  async () => await import('@components/ThemePicker/__mocks__/IconMock.astro')
)

type ThemePickerModule = WebComponentModule<ThemePickerElement>

type QueryRoot = ParentNode & {
  querySelector: (_selectors: string) => Element | null
  querySelectorAll: (_selectors: string) => NodeListOf<Element>
}

const queryElement = <T extends Element>(root: QueryRoot, selector: string): T => {
  const element = root.querySelector(selector) as T | null
  if (!element) {
    throw new TestError(`Expected element matching "${selector}" to exist`)
  }
  return element
}

const queryElements = <T extends Element>(root: QueryRoot, selector: string): T[] =>
  Array.from(root.querySelectorAll(selector)) as T[]

const getToggleButton = (doc: Document) =>
  queryElement<HTMLButtonElement>(doc, '.themepicker-toggle__toggle-btn')
const getThemeModal = (root: ThemePickerElement) =>
  queryElement<HTMLElement>(root, '[data-theme-modal]')
const getThemeCloseButton = (root: ThemePickerElement) =>
  queryElement<HTMLButtonElement>(root, '[data-theme-close]')
const getThemeList = (root: ThemePickerElement) => queryElement<HTMLElement>(root, '#theme-menu')
const getThemeListItems = (root: ThemePickerElement) =>
  queryElements<HTMLLIElement>(root, '.themepicker__item')
const getThemeButtons = (root: ThemePickerElement) =>
  queryElements<HTMLButtonElement>(root, '[data-theme]')
const getThemeSelectButtons = (root: ThemePickerElement) =>
  queryElements<HTMLButtonElement>(root, '.themepicker__selectBtn')

let container: AstroContainer

beforeAll(() => {
  Object.defineProperty(globalThis, 'CSS', {
    writable: true,
    value: {
      supports: () => true,
    },
  })
})

const renderThemePickerDom = async (
  assertion: (_context: { element: ThemePickerElement; window: Window }) => Promise<void> | void,
  props?: ThemePickerFixtureProps,
) => {
  const renderArgs = props ? { props: props as Record<string, unknown> } : undefined

  await executeRender<ThemePickerModule>({
    container,
    component: ThemePickerFixture,
    moduleSpecifier: '@components/ThemePicker/client/index',
    args: renderArgs,
    selector: 'theme-picker',
    waitForReady: async (element) => {
      await element.updateComplete
    },
    assert: async ({ element, window }) => {
      if (!window) {
        throw new TestError('ThemePicker tests require a Window instance from litRuntime')
      }
      await assertion({ element, window })
    },
  })
}

describe('ThemePicker Component', () => {
  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Structure', () => {
    it('should render theme-picker custom element', async () => {
      await renderThemePickerDom(({ element }) => {
        expect(element.tagName.toLowerCase()).toBe('theme-picker')
      })
    })

    it('should render toggle button in header', async () => {
      await renderThemePickerDom(({ window }) => {
        const toggleBtn = getToggleButton(window.document)
        expect(toggleBtn.getAttribute('aria-label')).toBe('toggle theme switcher')
        expect(toggleBtn.getAttribute('aria-haspopup')).toBe('true')
      })
    })

    it('should render modal with correct attributes', async () => {
      await renderThemePickerDom(({ element }) => {
        const modal = getThemeModal(element)
        expect(modal.hasAttribute('hidden')).toBe(true)
        expect(modal.classList.contains('themepicker')).toBe(true)
      })
    })

    it('should render theme selection buttons', async () => {
      await renderThemePickerDom(({ element }) => {
        const themeButtons = getThemeButtons(element)
        expect(themeButtons.length).toBeGreaterThan(0)

        const themes = themeButtons.map((btn) => btn.getAttribute('data-theme'))
        expect(themes).toContain('light')
        expect(themes).toContain('dark')
      })
    })

    it('should render close button', async () => {
      await renderThemePickerDom(({ element }) => {
        const closeBtn = getThemeCloseButton(element)
        expect(closeBtn.getAttribute('aria-label')).toBe('Close theme picker dialog')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on toggle button', async () => {
      await renderThemePickerDom(({ window }) => {
        const toggleBtn = getToggleButton(window.document)
        expect(toggleBtn.getAttribute('aria-expanded')).toBe('false')
        expect(toggleBtn.getAttribute('aria-controls')).toBe('theme-picker-panel')
        expect(toggleBtn.getAttribute('aria-haspopup')).toBe('true')
      })
    })

    it('should have accessible labels on theme buttons', async () => {
      await renderThemePickerDom(({ element }) => {
        const themeButtons = getThemeButtons(element)
        themeButtons.forEach((button) => {
          const label = button.getAttribute('aria-label')
          expect(label).toBeTruthy()
          expect(label).toMatch(/select color theme/i)
        })
      })
    })

    it('should have role="banner" on header', async () => {
      await renderThemePickerDom(({ window }) => {
        const header = queryElement<HTMLElement>(window.document, '#header')
        expect(header.getAttribute('role')).toBe('banner')
      })
    })
  })

  describe('Component Props', () => {
    it('should accept custom label prop', async () => {
      await renderThemePickerDom(({ element }) => {
        const heading = queryElement<HTMLHeadingElement>(element, '.themepicker h3')
        expect(heading.textContent?.trim()).toBe('Custom Theme Label')
      }, { label: 'Custom Theme Label' })
    })

    it('should use default label when not provided', async () => {
      await renderThemePickerDom(({ element }) => {
        const heading = queryElement<HTMLHeadingElement>(element, '.themepicker h3')
        expect(heading.textContent?.trim()).toBe('Select theme')
      })
    })
  })

  describe('CSS Classes', () => {
    it('should have Tailwind utility classes on modal', async () => {
      await renderThemePickerDom(({ element }) => {
        const modal = getThemeModal(element)
        expect(modal.classList.contains('bg-bg-offset')).toBe(true)
        expect(modal.classList.contains('block')).toBe(true)
        expect(modal.classList.contains('overflow-hidden')).toBe(true)
        expect(modal.classList.contains('relative')).toBe(true)
        expect(modal.classList.contains('w-full')).toBe(true)
      })
    })

    it('should have hover classes on theme items', async () => {
      await renderThemePickerDom(({ element }) => {
        const items = getThemeListItems(element)
        items.forEach((item) => {
          expect(item.classList.contains('hover:shadow-md')).toBe(true)
          expect(item.classList.contains('hover:scale-105')).toBe(true)
        })
      })
    })
  })

  describe('Data Attributes', () => {
    it('should mark modal with data-nosnippet', async () => {
      await renderThemePickerDom(({ element }) => {
        const modal = getThemeModal(element)
        expect(modal.hasAttribute('data-nosnippet')).toBe(true)
      })
    })

    it('should have data-theme attributes on selection buttons', async () => {
      await renderThemePickerDom(({ element }) => {
        const buttons = getThemeSelectButtons(element)
        buttons.forEach((button) => {
          expect(button.hasAttribute('data-theme')).toBe(true)
          const theme = button.getAttribute('data-theme')
          expect(['light', 'dark', 'holiday']).toContain(theme)
        })
      })
    })
  })

  describe('Theme List Structure', () => {
    it('should render theme list with correct ID', async () => {
      await renderThemePickerDom(({ element }) => {
        const list = getThemeList(element)
        expect(list.classList.contains('themepicker__list')).toBe(true)
      })
    })

    it('should render theme items as list elements', async () => {
      await renderThemePickerDom(({ element }) => {
        const items = getThemeListItems(element)
        items.forEach((item) => {
          expect(item.tagName).toBe('LI')
        })
      })
    })

    it('should have proper button structure in each theme item', async () => {
      await renderThemePickerDom(({ element }) => {
        const items = getThemeListItems(element)
        items.forEach((item) => {
          const button = item.querySelector('button') as HTMLButtonElement | null
          expect(button).toBeTruthy()
          expect(button?.classList.contains('themepicker__selectBtn')).toBe(true)
        })
      })
    })
  })

  describe('Color Palette Display', () => {
    it('should display color hues for each theme', async () => {
      await renderThemePickerDom(({ element }) => {
        const items = getThemeListItems(element)
        items.forEach((item) => {
          const hues = item.querySelectorAll('.themepicker__hue')
          expect(hues.length).toBe(5)
        })
      })
    })

    it('should have correct Tailwind color classes on hues', async () => {
      await renderThemePickerDom(({ element }) => {
        const items = getThemeListItems(element)
        expect(items.length).toBeGreaterThan(0)
        const firstItem = items[0]
        if (!firstItem) {
          throw new TestError('Expected at least one theme list item')
        }

        const hues = Array.from(firstItem.querySelectorAll('.themepicker__hue')) as HTMLElement[]
        const expectedClasses = ['bg-primary', 'bg-secondary', 'bg-border', 'bg-text-offset', 'bg-text']

        expectedClasses.forEach((className, index) => {
          const hue = hues[index]
          if (!hue) {
            throw new TestError(`Missing hue at index ${index}`)
          }
          expect(hue.classList.contains(className)).toBe(true)
        })
      })
    })
  })

  describe('Close Button', () => {
    it('should render sprite/icon for close button', async () => {
      await renderThemePickerDom(({ element }) => {
        const closeBtn = getThemeCloseButton(element)
        const svg = closeBtn.querySelector('svg')
        expect(svg).toBeTruthy()
      })
    })

    it('should have proper styling classes on close button', async () => {
      await renderThemePickerDom(({ element }) => {
        const closeBtn = getThemeCloseButton(element)
        expect(closeBtn.classList.contains('bg-secondary')).toBe(true)
        expect(closeBtn.classList.contains('text-text')).toBe(true)
        expect(closeBtn.classList.contains('absolute')).toBe(true)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should have horizontal scroll on theme list', async () => {
      await renderThemePickerDom(({ element }) => {
        const list = queryElement<HTMLElement>(element, '.themepicker__list')
        expect(list.classList.contains('overflow-x-auto')).toBe(true)
        expect(list.classList.contains('overflow-y-hidden')).toBe(true)
      })
    })

    it('should have whitespace-nowrap for horizontal layout', async () => {
      await renderThemePickerDom(({ element }) => {
        const list = queryElement<HTMLElement>(element, '.themepicker__list')
        expect(list.classList.contains('whitespace-nowrap')).toBe(true)
      })
    })
  })
})
