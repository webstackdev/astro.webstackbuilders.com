import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Contact CallToAction (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('labels the section and hides decorative icon svg', async () => {
    const Contact = (await import('@components/CallToAction/Contact/index.astro')).default

    const renderedHtml = await container.renderToString(Contact)

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const section = window.document.querySelector('section')
      expect(section).toBeTruthy()
      expect(section?.getAttribute('aria-labelledby')).toBe('contact-cta-title')
      expect(section?.getAttribute('aria-describedby')).toBe('contact-cta-description')

      const title = window.document.getElementById('contact-cta-title')
      expect(title?.tagName).toBe('H2')

      const description = window.document.getElementById('contact-cta-description')
      expect(description?.tagName).toBe('P')

      const primaryLink = window.document.querySelector(`a[href="/contact"]`)
      expect(primaryLink).toBeTruthy()

      const arrowIcon = primaryLink?.querySelector('svg')
      expect(arrowIcon?.getAttribute('aria-hidden')).toBe('true')
      expect(arrowIcon?.getAttribute('focusable')).toBe('false')
    })
  })

  test('supports a custom id base for aria relationships', async () => {
    const Contact = (await import('@components/CallToAction/Contact/index.astro')).default

    const renderedHtml = await container.renderToString(Contact, {
      props: {
        id: 'custom-contact',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const section = window.document.querySelector('section')
      expect(section?.getAttribute('aria-labelledby')).toBe('custom-contact-title')
      expect(section?.getAttribute('aria-describedby')).toBe('custom-contact-description')

      expect(window.document.getElementById('custom-contact-title')).toBeTruthy()
      expect(window.document.getElementById('custom-contact-description')).toBeTruthy()
    })
  })
})
