// @vitest-environment node
/**
 * ThemePicker Web Component Unit Tests
 * Tests the LitElement-based theme picker functionality
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Window } from 'happy-dom'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ThemePickerFixture from '@components/ThemePicker/__fixtures__/client.fixture.astro'
import type { Props as ThemePickerFixtureProps } from '@components/ThemePicker/__fixtures__/client.fixture.astro'

vi.mock(
  '@components/Sprite/index.astro',
  async () => await import('@components/ThemePicker/__mocks__/SpriteMock.astro')
)

type ParsedDocument = ReturnType<Window['DOMParser']['prototype']['parseFromString']>

interface RenderResult {
  document: ParsedDocument
}

const queryElement = <T extends Element>(selector: string, targetDoc: ParsedDocument): T => {
  const element = targetDoc.querySelector(selector) as T | null
  if (!element) {
    throw new Error(`Expected element matching "${selector}" to exist`)
  }
  return element
}

const queryElements = <T extends Element>(selector: string, targetDoc: ParsedDocument): T[] =>
  Array.from(targetDoc.querySelectorAll(selector)) as unknown as T[]

const renderFixture = async (
  container: AstroContainer,
  props?: ThemePickerFixtureProps
): Promise<RenderResult> => {
  const renderOptions = props ? { props: props as Record<string, unknown> } : undefined
  const html = await container.renderToString(ThemePickerFixture, renderOptions)
  const window = new Window()
  const parser = new window.DOMParser()
  const document = parser.parseFromString(html, 'text/html')
  return { document }
}

describe('ThemePicker Component', () => {
  let container: AstroContainer
  let documentRef: ParsedDocument

  beforeEach(async () => {
    container = await AstroContainer.create()
    const renderResult = await renderFixture(container)
    documentRef = renderResult.document
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const getThemePickerElement = (doc = documentRef) => queryElement<HTMLElement>('theme-picker', doc)
  const getToggleButton = (doc = documentRef) => queryElement<HTMLButtonElement>('.themepicker-toggle__toggle-btn', doc)
  const getThemeModal = (doc = documentRef) => queryElement<HTMLElement>('[data-theme-modal]', doc)
  const getThemeCloseButton = (doc = documentRef) => queryElement<HTMLButtonElement>('[data-theme-close]', doc)
  const getThemeList = (doc = documentRef) => queryElement<HTMLElement>('#theme-menu', doc)
  const getThemeListItems = (doc = documentRef) => queryElements<HTMLLIElement>('.themepicker__item', doc)
  const getThemeButtons = (doc = documentRef) => queryElements<HTMLButtonElement>('[data-theme]', doc)
  const getThemeSelectButtons = (doc = documentRef) => queryElements<HTMLButtonElement>('.themepicker__selectBtn', doc)

  describe('Component Structure', () => {
    it('should render theme-picker custom element', () => {
      const themePicker = getThemePickerElement()
      expect(themePicker.tagName.toLowerCase()).toBe('theme-picker')
    })

    it('should render toggle button in header', () => {
      const toggleBtn = getToggleButton()
      expect(toggleBtn.getAttribute('aria-label')).toBe('toggle theme switcher')
      expect(toggleBtn.getAttribute('aria-haspopup')).toBe('true')
    })

    it('should render modal with correct attributes', () => {
      const modal = getThemeModal()
      expect(modal.hasAttribute('hidden')).toBe(true)
      expect(modal.classList.contains('themepicker')).toBe(true)
    })

    it('should render theme selection buttons', () => {
      const themeButtons = getThemeButtons()
      expect(themeButtons.length).toBeGreaterThan(0)

      // Should have at least light and dark (holiday is seasonal and may be commented out)
      const themes = themeButtons.map(btn => btn.getAttribute('data-theme'))
      expect(themes).toContain('light')
      expect(themes).toContain('dark')
    })

    it('should render close button', () => {
      const closeBtn = getThemeCloseButton()
      expect(closeBtn.getAttribute('aria-label')).toBe('Close theme picker dialog')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on toggle button', () => {
      const toggleBtn = getToggleButton()
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('false')
      expect(toggleBtn.getAttribute('aria-owns')).toBe('theme-menu')
      expect(toggleBtn.getAttribute('aria-haspopup')).toBe('true')
    })

    it('should have accessible labels on theme buttons', () => {
      const themeButtons = getThemeButtons()
      themeButtons.forEach(button => {
        const label = button.getAttribute('aria-label')
        expect(label).toBeTruthy()
        expect(label).toMatch(/select color theme/i)
      })
    })

    it('should have role="banner" on header', () => {
      const header = queryElement<HTMLElement>('#header', documentRef)
      expect(header.getAttribute('role')).toBe('banner')
    })
  })

  describe('Component Props', () => {
    it('should accept custom label prop', async () => {
      const { document: customDoc } = await renderFixture(container, { label: 'Custom Theme Label' })
      const heading = queryElement<HTMLHeadingElement>('.themepicker h3', customDoc)
      expect(heading.textContent?.trim()).toBe('Custom Theme Label')
    })

    it('should use default label when not provided', () => {
      const heading = queryElement<HTMLHeadingElement>('.themepicker h3', documentRef)
      expect(heading.textContent?.trim()).toBe('Select theme')
    })
  })

  describe('CSS Classes', () => {
    it('should have Tailwind utility classes on modal', () => {
      const modal = getThemeModal()
      expect(modal.classList.contains('bg-bg-offset')).toBe(true)
      expect(modal.classList.contains('block')).toBe(true)
      expect(modal.classList.contains('overflow-hidden')).toBe(true)
      expect(modal.classList.contains('relative')).toBe(true)
      expect(modal.classList.contains('w-full')).toBe(true)
    })

    it('should have hover classes on theme items', () => {
      const items = getThemeListItems()
      items.forEach(item => {
        expect(item.classList.contains('hover:shadow-md')).toBe(true)
        expect(item.classList.contains('hover:scale-105')).toBe(true)
      })
    })
  })

  describe('Data Attributes', () => {
    it('should mark modal with data-nosnippet', () => {
      const modal = getThemeModal()
      expect(modal.hasAttribute('data-nosnippet')).toBe(true)
    })

    it('should have data-theme attributes on selection buttons', () => {
      const buttons = getThemeSelectButtons()
      buttons.forEach(button => {
        expect(button.hasAttribute('data-theme')).toBe(true)
        const theme = button.getAttribute('data-theme')
        expect(['light', 'dark', 'holiday']).toContain(theme)
      })
    })
  })

  describe('Theme List Structure', () => {
    it('should render theme list with correct ID', () => {
      const list = getThemeList()
      expect(list.classList.contains('themepicker__list')).toBe(true)
    })

    it('should render theme items as list elements', () => {
      const items = getThemeListItems()
      items.forEach(item => {
        expect(item.tagName).toBe('LI')
      })
    })

    it('should have proper button structure in each theme item', () => {
      const items = getThemeListItems()
      items.forEach(item => {
        const button = item.querySelector('button') as HTMLButtonElement | null
        expect(button).toBeTruthy()
        expect(button?.classList.contains('themepicker__selectBtn')).toBe(true)
      })
    })
  })

  describe('Color Palette Display', () => {
    it('should display color hues for each theme', () => {
      const items = getThemeListItems()
      items.forEach(item => {
        const hues = item.querySelectorAll('.themepicker__hue')
        // Each theme should show 5 color hues
        expect(hues.length).toBe(5)
      })
    })

    it('should have correct Tailwind color classes on hues', () => {
      const items = getThemeListItems()
      expect(items.length).toBeGreaterThan(0)
      const firstItem = items[0]
      if (!firstItem) {
        throw new Error('Expected at least one theme list item')
      }

      const hues = Array.from(firstItem.querySelectorAll('.themepicker__hue')) as HTMLElement[]
      const expectedClasses = ['bg-primary', 'bg-secondary', 'bg-border', 'bg-text-offset', 'bg-text']

      expectedClasses.forEach((className, index) => {
        const hue = hues[index]
        if (!hue) {
          throw new Error(`Missing hue at index ${index}`)
        }
        expect(hue.classList.contains(className)).toBe(true)
      })
    })
  })

  describe('Close Button', () => {
    it('should render sprite/icon for close button', () => {
      const closeBtn = getThemeCloseButton()
      const svg = closeBtn.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('should have proper styling classes on close button', () => {
      const closeBtn = getThemeCloseButton()
      expect(closeBtn.classList.contains('bg-secondary')).toBe(true)
      expect(closeBtn.classList.contains('text-text')).toBe(true)
      expect(closeBtn.classList.contains('absolute')).toBe(true)
    })
  })

  describe('Responsive Design', () => {
    it('should have horizontal scroll on theme list', () => {
      const list = queryElement<HTMLElement>('.themepicker__list', documentRef)
      expect(list.classList.contains('overflow-x-auto')).toBe(true)
      expect(list.classList.contains('overflow-y-hidden')).toBe(true)
    })

    it('should have whitespace-nowrap for horizontal layout', () => {
      const list = queryElement<HTMLElement>('.themepicker__list', documentRef)
      expect(list.classList.contains('whitespace-nowrap')).toBe(true)
    })
  })
})
