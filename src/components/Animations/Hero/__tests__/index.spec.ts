import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Home Hero (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('labels the hero section and renders the hardcoded CTAs', async () => {
    const HomeHero = (await import('@components/Animations/Hero/index.astro')).default

    const renderedHtml = await container.renderToString(HomeHero, {
      props: {
        pretitle:
          'I turn deployment nightmares into one-click operations. Legacy migrations, CI/CD pipelines, observability stacks—built to survive production.',
        benefits: ['Zero-downtime migrations', 'Self-healing infrastructure', 'Developer-friendly golden paths'],
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const section = window.document.querySelector('section')
      expect(section).toBeTruthy()
      expect(section?.getAttribute('aria-labelledby')).toBe('home-hero-title')

      const title = window.document.getElementById('home-hero-title')
      expect(title?.tagName).toBe('H1')

      const primaryLink = window.document.querySelector('a[href="/about"]')
      expect(primaryLink).toBeTruthy()
      expect(primaryLink?.getAttribute('class')).toContain('bg-success')

      const secondaryLink = window.document.querySelector(
        'a[href="/contact"]:not([data-hero-ready-link])'
      )
      expect(secondaryLink).toBeTruthy()
      const secondaryClass = secondaryLink?.getAttribute('class') || ''
      expect(secondaryClass).toContain('decoration-dotted')
      expect(secondaryClass).toContain('focus-visible:decoration-dotted')
      expect(secondaryClass).toContain('hover:decoration-content-offset')
      expect(secondaryClass).toContain('focus-visible:decoration-content-offset')

      const readyLink = window.document.querySelector('a[data-hero-ready-link]')
      expect(readyLink).toBeTruthy()
      expect(readyLink?.getAttribute('href')).toBe('/contact')

      const readyClass = readyLink?.getAttribute('class') || ''
      expect(readyClass).toContain('no-underline')
      expect(readyClass).toContain('text-success')
      expect(readyClass).toContain('hover:text-success-offset')
      expect(readyClass).toContain('focus-visible:text-success-offset')
    })
  })
})
