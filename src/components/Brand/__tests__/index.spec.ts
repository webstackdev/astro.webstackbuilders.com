import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Brand (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders a home link with a descriptive label and decorative SVGs', async () => {
    const Brand = (await import('@components/Brand/index.astro')).default

    const renderedHtml = await container.renderToString(Brand)

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const link = window.document.querySelector('a[rel="home"][href="/"]')
      expect(link).toBeTruthy()
      expect(link?.getAttribute('aria-label')).toBe('Webstack Builders home')

      const svgs = link?.querySelectorAll('svg')
      expect(svgs?.length).toBeGreaterThan(0)

      svgs?.forEach((svg) => {
        expect(svg.getAttribute('aria-hidden')).toBe('true')
        expect(svg.getAttribute('focusable')).toBe('false')
      })

      const logoTitle = link?.querySelector('svg#logo title')
      expect(logoTitle).toBeFalsy()
    })
  })
})
