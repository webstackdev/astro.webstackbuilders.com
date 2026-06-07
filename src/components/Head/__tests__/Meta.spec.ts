import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { JSDOM } from 'jsdom'

describe('Meta (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders canonical link from canonicalPath when provided', async () => {
    const Meta = (await import('@components/Head/Meta.astro')).default

    const response = await container.renderToResponse(Meta, {
      props: {
        pageTitle: 'Example Article',
        pageDescription: 'Example description',
        path: '/articles/example-article',
        canonicalPath: '/deep-dive/example-article',
      },
      request: new Request('https://example.com/articles/example-article'),
      partial: false,
    })

    const renderedHtml = await response.text()
    const document = new JSDOM(renderedHtml).window.document

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://example.com/deep-dive/example-article'
    )
  })

  test('renders explicit robots content when provided', async () => {
    const Meta = (await import('@components/Head/Meta.astro')).default

    const response = await container.renderToResponse(Meta, {
      props: {
        pageTitle: 'Example Article',
        pageDescription: 'Example description',
        path: '/articles/example-article',
        robotsContent: 'noindex, follow',
      },
      request: new Request('https://example.com/articles/example-article'),
      partial: false,
    })

    const renderedHtml = await response.text()
    const document = new JSDOM(renderedHtml).window.document

    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, follow'
    )
  })
})