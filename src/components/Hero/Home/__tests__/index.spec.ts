import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Home Hero (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('labels the hero section and hides decorative CTA arrow svgs', async () => {
    const HomeHero = (await import('@components/Hero/Home/index.astro')).default

    const renderedHtml = await container.renderToString(HomeHero)

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const section = window.document.querySelector('section')
      expect(section).toBeTruthy()
      expect(section?.getAttribute('aria-labelledby')).toBe('home-hero-title')

      const title = window.document.getElementById('home-hero-title')
      expect(title?.tagName).toBe('H1')

      const primaryLink = window.document.querySelector('a[href="/services/web-development"]')
      expect(primaryLink).toBeTruthy()
      const primaryArrow = primaryLink?.querySelector('svg')
      expect(primaryArrow?.getAttribute('aria-hidden')).toBe('true')
      expect(primaryArrow?.getAttribute('focusable')).toBe('false')

      const secondaryLink = window.document.querySelector('a[href="/services/consulting"]')
      expect(secondaryLink).toBeTruthy()
      const secondaryArrow = secondaryLink?.querySelector('svg')
      expect(secondaryArrow?.getAttribute('aria-hidden')).toBe('true')
      expect(secondaryArrow?.getAttribute('focusable')).toBe('false')
    })
  })
})
