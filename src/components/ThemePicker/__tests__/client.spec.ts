// @vitest-environment happy-dom
/**
 * ThemePicker Web Component Unit Tests
 * Tests the LitElement-based theme picker functionality
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ThemePickerFixture from '@components/ThemePicker/__fixtures__/client.fixture.astro'

describe('ThemePicker Component', () => {
  let container: AstroContainer
  let html: string

  beforeEach(async () => {
    container = await AstroContainer.create()
    html = await container.renderToString(ThemePickerFixture)
    document.body.innerHTML = html

    // Wait for all async operations (including Lit component initialization) to complete
    await (window as any).happyDOM.whenAsyncComplete()

    // Additional tick to ensure event handlers are bound
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('Component Structure', () => {
    it('should render theme-picker custom element', () => {
      const themePicker = document.querySelector('theme-picker')
      expect(themePicker).toBeTruthy()
    })

    it('should render toggle button in header', () => {
      const toggleBtn = document.querySelector('.themepicker-toggle__toggle-btn')
      expect(toggleBtn).toBeTruthy()
      expect(toggleBtn?.getAttribute('aria-label')).toBe('toggle theme switcher')
      expect(toggleBtn?.getAttribute('aria-haspopup')).toBe('true')
    })

    it('should render modal with correct attributes', () => {
      const modal = document.querySelector('[data-theme-modal]')
      expect(modal).toBeTruthy()
      expect(modal?.hasAttribute('hidden')).toBe(true)
      expect(modal?.classList.contains('themepicker')).toBe(true)
    })

    it('should render theme selection buttons', () => {
      const themeButtons = document.querySelectorAll('[data-theme]')
      expect(themeButtons.length).toBeGreaterThan(0)

      // Should have at least light and dark (holiday is seasonal and may be commented out)
      const themes = Array.from(themeButtons).map(btn => btn.getAttribute('data-theme'))
      expect(themes).toContain('light')
      expect(themes).toContain('dark')
    })

    it('should render close button', () => {
      const closeBtn = document.querySelector('[data-theme-close]')
      expect(closeBtn).toBeTruthy()
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close theme picker dialog')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on toggle button', () => {
      const toggleBtn = document.querySelector('.themepicker-toggle__toggle-btn')
      expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false')
      expect(toggleBtn?.getAttribute('aria-owns')).toBe('theme-menu')
      expect(toggleBtn?.getAttribute('aria-haspopup')).toBe('true')
    })

    it('should have accessible labels on theme buttons', () => {
      const themeButtons = document.querySelectorAll('[data-theme]')
      themeButtons.forEach(button => {
        const label = button.getAttribute('aria-label')
        expect(label).toBeTruthy()
        expect(label).toMatch(/select color theme/i)
      })
    })

    it('should have role="banner" on header', () => {
      const header = document.querySelector('#header')
      expect(header?.getAttribute('role')).toBe('banner')
    })
  })

  describe('Component Props', () => {
    it('should accept custom label prop', async () => {
      const customHtml = await container.renderToString(ThemePickerFixture, {
        props: { label: 'Custom Theme Label' }
      })
      expect(customHtml).toContain('Custom Theme Label')
    })

    it('should use default label when not provided', () => {
      const heading = document.querySelector('.themepicker h3')
      expect(heading?.textContent?.trim()).toBe('Select theme')
    })
  })

  describe('CSS Classes', () => {
    it('should have Tailwind utility classes on modal', () => {
      const modal = document.querySelector('[data-theme-modal]')
      expect(modal?.classList.contains('bg-bg-offset')).toBe(true)
      expect(modal?.classList.contains('block')).toBe(true)
      expect(modal?.classList.contains('overflow-hidden')).toBe(true)
      expect(modal?.classList.contains('relative')).toBe(true)
      expect(modal?.classList.contains('w-full')).toBe(true)
    })

    it('should have hover classes on theme items', () => {
      const items = document.querySelectorAll('.themepicker__item')
      items.forEach(item => {
        expect(item.classList.contains('hover:shadow-md')).toBe(true)
        expect(item.classList.contains('hover:scale-105')).toBe(true)
      })
    })
  })

  describe('Data Attributes', () => {
    it('should mark modal with data-nosnippet', () => {
      const modal = document.querySelector('[data-theme-modal]')
      expect(modal?.hasAttribute('data-nosnippet')).toBe(true)
    })

    it('should have data-theme attributes on selection buttons', () => {
      const buttons = document.querySelectorAll('.themepicker__selectBtn')
      buttons.forEach(button => {
        expect(button.hasAttribute('data-theme')).toBe(true)
        const theme = button.getAttribute('data-theme')
        expect(['light', 'dark', 'holiday']).toContain(theme)
      })
    })
  })

  describe('Theme List Structure', () => {
    it('should render theme list with correct ID', () => {
      const list = document.querySelector('#theme-menu')
      expect(list).toBeTruthy()
      expect(list?.classList.contains('themepicker__list')).toBe(true)
    })

    it('should render theme items as list elements', () => {
      const items = document.querySelectorAll('.themepicker__item')
      items.forEach(item => {
        expect(item.tagName).toBe('LI')
      })
    })

    it('should have proper button structure in each theme item', () => {
      const items = document.querySelectorAll('.themepicker__item')
      items.forEach(item => {
        const button = item.querySelector('button')
        expect(button).toBeTruthy()
        expect(button?.classList.contains('themepicker__selectBtn')).toBe(true)
      })
    })
  })

  describe('Color Palette Display', () => {
    it('should display color hues for each theme', () => {
      const items = document.querySelectorAll('.themepicker__item')
      items.forEach(item => {
        const hues = item.querySelectorAll('.themepicker__hue')
        // Each theme should show 5 color hues
        expect(hues.length).toBe(5)
      })
    })

    it('should have correct Tailwind color classes on hues', () => {
      const firstItem = document.querySelector('.themepicker__item')
      const hues = firstItem?.querySelectorAll('.themepicker__hue')

      expect(hues?.[0].classList.contains('bg-primary')).toBe(true)
      expect(hues?.[1].classList.contains('bg-secondary')).toBe(true)
      expect(hues?.[2].classList.contains('bg-border')).toBe(true)
      expect(hues?.[3].classList.contains('bg-text-offset')).toBe(true)
      expect(hues?.[4].classList.contains('bg-text')).toBe(true)
    })
  })

  describe('Close Button', () => {
    it('should render sprite/icon for close button', () => {
      const closeBtn = document.querySelector('[data-theme-close]')
      const svg = closeBtn?.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('should have proper styling classes on close button', () => {
      const closeBtn = document.querySelector('[data-theme-close]')
      expect(closeBtn?.classList.contains('bg-secondary')).toBe(true)
      expect(closeBtn?.classList.contains('text-text')).toBe(true)
      expect(closeBtn?.classList.contains('absolute')).toBe(true)
    })
  })

  describe('Responsive Design', () => {
    it('should have horizontal scroll on theme list', () => {
      const list = document.querySelector('.themepicker__list')
      expect(list?.classList.contains('overflow-x-auto')).toBe(true)
      expect(list?.classList.contains('overflow-y-hidden')).toBe(true)
    })

    it('should have whitespace-nowrap for horizontal layout', () => {
      const list = document.querySelector('.themepicker__list')
      expect(list?.classList.contains('whitespace-nowrap')).toBe(true)
    })
  })
})
