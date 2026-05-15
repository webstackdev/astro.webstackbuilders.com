import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { JSDOM } from 'jsdom'

describe('Social (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders explicit Open Graph and Twitter image metadata', async () => {
    const Social = (await import('@components/Head/Social.astro')).default
    const title = 'Platform Engineering for Modern Teams'
    const description =
      'Platform engineer Kevin Brown builds resilient delivery platforms, cloud foundations, and better developer experience.'

    const response = await container.renderToResponse(Social, {
      props: {
        title,
        description,
        path: '/',
      },
      request: new Request('https://example.com/'),
      partial: false,
    })

    const renderedHtml = await response.text()
    const document = new JSDOM(renderedHtml).window.document
    const socialImageUrl = 'https://example.com/api/social-card?slug=home'

    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(title)
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(
      description
    )
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      socialImageUrl
    )
    expect(document.querySelector('meta[property="og:image:width"]')?.getAttribute('content')).toBe(
      '1200'
    )
    expect(document.querySelector('meta[property="og:image:height"]')?.getAttribute('content')).toBe(
      '630'
    )
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(
      title
    )
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe(
      description
    )
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(
      socialImageUrl
    )
  })
})