import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Breadcrumbs (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders a Breadcrumbs nav with one JSON-LD script and focusable links', async () => {
    const Breadcrumbs = (await import('@components/Breadcrumbs/index.astro')).default

    const renderedHtml = await container.renderToString(Breadcrumbs, {
      props: {
        path: '/articles/my-post',
        pageTitle: 'My Post Title',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const nav = window.document.querySelector('nav[aria-label="Breadcrumbs"]')
      expect(nav).toBeTruthy()

      const current = window.document.querySelector('[aria-current="page"]')
      expect(current?.textContent).toContain('My Post Title')

      const links = window.document.querySelectorAll('nav[aria-label="Breadcrumbs"] a[href]')
      expect(links.length).toBeGreaterThan(0)
      links.forEach(link => {
        expect(link.className).toContain('focus:underline')
        expect(link.className).toContain('focus:outline-none')
      })

      const jsonLdScripts = window.document.querySelectorAll('script[type="application/ld+json"]')
      expect(jsonLdScripts.length).toBeLessThanOrEqual(1)
    })
  })
})
