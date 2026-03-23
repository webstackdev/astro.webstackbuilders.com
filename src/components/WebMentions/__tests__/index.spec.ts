import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'

describe('WebMentions (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    vi.resetModules()
    container = await AstroContainer.create()
  })

  test('renders the client web component shell and icon bank', async () => {
    const WebMentions = (await import('@components/WebMentions/index.astro')).default

    const renderedHtml = await container.renderToString(WebMentions, {
      props: {
        url: 'https://example.com/post',
        showFacepile: true,
        facepileLimit: 1,
      },
    })

    expect(renderedHtml).toContain('<web-mentions')
    expect(renderedHtml).toContain('data-webmentions-icon="heart-filled"')
    expect(renderedHtml).toContain('data-webmentions-icon="background-broken"')
    expect(renderedHtml).toContain('show-facepile')
  })
})
