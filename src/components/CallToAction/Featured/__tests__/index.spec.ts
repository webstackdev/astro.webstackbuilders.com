import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Featured CallToAction (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('labels the aside landmark via aria-labelledby', async () => {
    const Featured = (await import('@components/CallToAction/Featured/index.astro')).default

    const renderedHtml = await container.renderToString(Featured, {
      props: {
        title: 'Example featured',
        description: 'Example description',
        link: { href: '/example', text: 'Learn more' },
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const aside = window.document.querySelector('aside')
      expect(aside).toBeTruthy()
      expect(aside?.getAttribute('aria-labelledby')).toBe('featured-cta-title')

      const title = window.document.getElementById('featured-cta-title')
      expect(title?.tagName).toBe('H3')
      expect(title?.textContent).toContain('Example featured')
    })
  })

  test('supports a custom id base for aria relationships', async () => {
    const Featured = (await import('@components/CallToAction/Featured/index.astro')).default

    const renderedHtml = await container.renderToString(Featured, {
      props: {
        id: 'custom-featured',
        title: 'Example featured',
        description: 'Example description',
        link: { href: '/example', text: 'Learn more' },
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const aside = window.document.querySelector('aside')
      expect(aside?.getAttribute('aria-labelledby')).toBe('custom-featured-title')
      expect(window.document.getElementById('custom-featured-title')).toBeTruthy()
    })
  })
})
