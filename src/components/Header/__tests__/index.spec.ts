import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Header (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('polishes navigation and toggle button semantics', async () => {
    const Header = (await import('@components/Header/index.astro')).default

    const renderedHtml = await container.renderToString(Header, {
      props: {
        path: '/about',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const header = window.document.querySelector('header#header')
      expect(header).toBeTruthy()

      const nav = window.document.querySelector('nav#main-nav')
      expect(nav?.getAttribute('aria-label')).toBe('Main')

      const menu = window.document.querySelector('ul.main-nav-menu')
      expect(menu).toBeTruthy()
      expect(menu?.getAttribute('aria-label')).toBeNull()

      const activeLink = window.document.querySelector('a[href="/about"]')
      expect(activeLink?.getAttribute('aria-current')).toBe('page')

      const toggleButton = window.document.querySelector('button.nav-toggle-btn')
      expect(toggleButton).toBeTruthy()
      expect(toggleButton?.getAttribute('aria-label')).toBe('Open main menu')
      expect(toggleButton?.getAttribute('aria-haspopup')).toBeNull()

      const toggleSvg = toggleButton?.querySelector('svg')
      expect(toggleSvg?.getAttribute('aria-hidden')).toBe('true')
      expect(toggleSvg?.getAttribute('focusable')).toBe('false')
      expect(toggleSvg?.querySelector('title')).toBeNull()

      const themeButton = window.document.querySelector('button.theme-toggle-btn')
      expect(themeButton).toBeTruthy()
      const themeSvg = themeButton?.querySelector('svg')
      expect(themeSvg?.getAttribute('aria-hidden')).toBe('true')
      expect(themeSvg?.getAttribute('focusable')).toBe('false')
      expect(themeSvg?.querySelector('title')).toBeNull()
    })
  })
})
