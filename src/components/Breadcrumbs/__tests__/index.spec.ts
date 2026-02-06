import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Breadcrumbs (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders a Breadcrumbs nav with at most one JSON-LD script and keyboard-focusable links', async () => {
    const Breadcrumbs = (await import('@components/Breadcrumbs/index.astro')).default

    const response = await container.renderToResponse(Breadcrumbs, {
      props: {
        path: '/articles/my-post',
        pageTitle: 'My Post Title',
      },
      request: new Request('https://example.com/articles/my-post'),
      partial: false,
    })

    const renderedHtml = await response.text()

    await withJsdomEnvironment(async ({ window }) => {
      const doc = new window.DOMParser().parseFromString(renderedHtml, 'text/html')

      const nav = doc.querySelector('nav[aria-label="Breadcrumbs"]')
      expect(nav).toBeTruthy()

      const current = doc.querySelector('[aria-current="page"]')
      expect(current?.textContent).toContain('My Post Title')

      const links = doc.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Breadcrumbs"] a[href]')
      expect(links.length).toBeGreaterThan(0)
      links.forEach(link => {
        expect(link.getAttribute('href')?.trim().length).toBeGreaterThan(0)
        expect(link.textContent?.trim().length).toBeGreaterThan(0)

        // In a DOM environment, an anchor with an href should be keyboard-focusable.
        // This avoids coupling the test to styling implementation details (Tailwind classes).
        expect(link.tabIndex).toBeGreaterThanOrEqual(0)
      })

      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]')
      expect(jsonLdScripts.length).toBe(1)

      const jsonLdScript = jsonLdScripts.item(0)

      // Validate the JSON-LD schema content (structure + absolute URLs) without coupling to CSS.
      const jsonText = jsonLdScript?.textContent?.trim() ?? ''
      expect(jsonText.length).toBeGreaterThan(0)

      const schema = JSON.parse(jsonText) as {
        '@context'?: unknown
        '@type'?: unknown
        itemListElement?: unknown
      }

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('BreadcrumbList')

      expect(Array.isArray(schema.itemListElement)).toBe(true)

      const items = schema.itemListElement as Array<{
        '@type'?: unknown
        position?: unknown
        name?: unknown
        item?: unknown
      }>

      expect(items.length).toBeGreaterThan(1)

      items.forEach((item, index) => {
        expect(item['@type']).toBe('ListItem')
        expect(item.position).toBe(index + 1)
        expect(typeof item.name).toBe('string')
        expect((item.name as string).trim().length).toBeGreaterThan(0)
        expect(typeof item.item).toBe('string')
        expect((item.item as string).startsWith('https://example.com/')).toBe(true)
      })

      // Spot-check a couple of key breadcrumb nodes to ensure alignment with the rendered path.
      expect(items[0]?.name).toBe('Home')
      expect(items[0]?.item).toBe('https://example.com/')

      const last = items.at(-1)
      expect(last?.name).toBe('My Post Title')
      expect(last?.item).toBe('https://example.com/articles/my-post')
    })
  })
})
