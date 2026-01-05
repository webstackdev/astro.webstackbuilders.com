import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SocialEmbed from '@components/Social/Embed/index.astro'
import LinkedInFixture from '@components/Social/Embed/client/__fixtures__/linkedin.fixture.astro'
import type { SocialEmbedElement } from '@components/Social/Embed/client/webComponent'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type SocialEmbedModule = WebComponentModule<SocialEmbedElement>

describe('SocialEmbed component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const renderComponent = async (
    props: { url: string; platform?: string },
    assertion: (_params: { element: SocialEmbedElement }) => Promise<void> | void,
    componentOverride: typeof SocialEmbed = SocialEmbed
  ) => {
    await executeRender<SocialEmbedModule>({
      container,
      component: componentOverride,
      moduleSpecifier: '@components/Social/Embed/webComponent',
      args: { props },
      waitForReady: async element => {
        await element.updateComplete
      },
      assert: async ({ element, renderResult }) => {
        expect(renderResult).toContain('<social-embed')
        await assertion({ element })
      },
    })
  }

  test('renders placeholder content and data attributes for default platform', async () => {
    const url = 'https://twitter.com/user/status/1234567890'

    await renderComponent({ url }, async ({ element }) => {
      expect(element.dataset['embed']).toBeDefined()
      expect(element.dataset['embedUrl']).toBe(url)
      expect(element.dataset['embedPlatform']).toBeUndefined()
      expect(element.getAttribute('aria-busy')).toBe('true')

      const status = element.querySelector('[data-embed-loading-status]')
      expect(status).not.toBeNull()
      expect(status?.getAttribute('role')).toBe('status')
      expect(status?.getAttribute('aria-live')).toBe('polite')

      const placeholder = element.querySelector('[data-embed-placeholder]')
      expect(placeholder).not.toBeNull()
      expect(placeholder?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  test('renders slot content for LinkedIn embeds', async () => {
    const url = 'https://www.linkedin.com/embed/feed/update/urn:li:share:123'

    await renderComponent(
      { url, platform: 'linkedin' },
      async ({ element }) => {
        expect(element.dataset['embedPlatform']).toBe('linkedin')
        expect(element.getAttribute('aria-busy')).toBe('false')
        expect(element.querySelector('iframe')?.getAttribute('src')).toBe(url)
        expect(element.querySelector('[data-embed-placeholder]')).toBeNull()
      },
      LinkedInFixture
    )
  })

  test('includes media preview section for video platforms', async () => {
    const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

    await renderComponent({ url, platform: 'youtube' }, async ({ element }) => {
      expect(element.dataset['embedPlatform']).toBe('youtube')
      expect(element.getAttribute('aria-busy')).toBe('true')
      const placeholder = element.querySelector('[data-embed-placeholder]')
      expect(placeholder).not.toBeNull()
      expect(placeholder?.querySelector('.aspect-video')).not.toBeNull()
    })
  })

  test('syncs dataset attributes when url or platform change after render', async () => {
    const url = 'https://reddit.com/r/webdev/comments/abc123'
    const updatedUrl = 'https://reddit.com/r/webdev/comments/xyz789'

    await renderComponent({ url, platform: 'reddit' }, async ({ element }) => {
      expect(element.dataset['embedPlatform']).toBe('reddit')
      expect(element.dataset['embedUrl']).toBe(url)

      element.url = updatedUrl
      element.platform = undefined
      await element.updateComplete

      expect(element.dataset['embedUrl']).toBe(updatedUrl)
      expect(element.dataset['embedPlatform']).toBeUndefined()
    })
  })
})
