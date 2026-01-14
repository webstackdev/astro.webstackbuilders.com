import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SocialEmbed from '@components/Social/Embed/index.astro'
import LinkedInFixture from '@components/Social/Embed/client/__fixtures__/linkedin.fixture.astro'
import { EmbedManager } from '@components/Social/Embed/client'
import type { SocialEmbedElement } from '@components/Social/Embed/client/webComponent'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type SocialEmbedModule = WebComponentModule<SocialEmbedElement>

const flushPromises = () => new Promise<void>(resolve => setTimeout(resolve, 0))

class ImmediateIntersectionObserver {
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback(
      [
        {
          isIntersecting: true,
          target,
          intersectionRatio: 1,
          time: 0,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver
    )
  }

  unobserve(_target: Element) {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

describe('EmbedManager', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('loads oEmbed content, ensures iframe titles, and clears loading state', async () => {
    await executeRender<SocialEmbedModule>({
      container,
      component: SocialEmbed,
      moduleSpecifier: '@components/Social/Embed/webComponent',
      args: {
        props: {
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          platform: 'youtube',
        },
      },
      waitForReady: async element => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        const previousIntersectionObserver = (
          globalThis as unknown as { IntersectionObserver?: unknown }
        ).IntersectionObserver
        ;(globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver =
          ImmediateIntersectionObserver as unknown as typeof IntersectionObserver

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => ({
            title: 'Example embed title',
            html: '<iframe src="https://example.com/embed"></iframe>',
          }),
        } as Response)

        expect(element.querySelector('[data-embed-placeholder]')).not.toBeNull()
        expect(element.querySelector('[data-embed-loading-status]')).not.toBeNull()
        expect(element.getAttribute('aria-busy')).toBe('true')

        EmbedManager.reset()
        EmbedManager.init()
        await flushPromises()
        await flushPromises()

        expect(fetchSpy).toHaveBeenCalled()
        const calledUrl = String(fetchSpy.mock.calls[0]?.[0] ?? '')
        expect(calledUrl).toContain('www.youtube.com/oembed')
        expect(calledUrl).toContain('maxwidth=560')
        expect(calledUrl).toContain('maxheight=315')

        const iframe = window?.document.querySelector('social-embed iframe')
        expect(iframe).not.toBeNull()
        expect(iframe?.getAttribute('title')).toBe('Example embed title')

        expect(element.querySelector('[data-embed-placeholder]')).toBeNull()
        expect(element.querySelector('[data-embed-loading-status]')).toBeNull()
        expect(element.getAttribute('aria-busy')).toBe('false')

        fetchSpy.mockRestore()
        ;(globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver =
          previousIntersectionObserver
      },
    })
  })

  test('uses custom width/height for YouTube oEmbed requests', async () => {
    await executeRender<SocialEmbedModule>({
      container,
      component: SocialEmbed,
      moduleSpecifier: '@components/Social/Embed/webComponent',
      args: {
        props: {
          url: 'https://youtube.com/watch?v=customVideoId123456',
          platform: 'youtube',
          width: 640,
          height: 360,
        },
      },
      waitForReady: async element => {
        await element.updateComplete
      },
      assert: async () => {
        const previousIntersectionObserver = (
          globalThis as unknown as { IntersectionObserver?: unknown }
        ).IntersectionObserver
        ;(globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver =
          ImmediateIntersectionObserver as unknown as typeof IntersectionObserver

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => ({
            title: 'Example embed title',
            html: '<iframe src="https://example.com/embed"></iframe>',
          }),
        } as Response)

        EmbedManager.reset()
        EmbedManager.init()
        await flushPromises()
        await flushPromises()

        expect(fetchSpy).toHaveBeenCalled()
        const calledUrl = String(fetchSpy.mock.calls[0]?.[0] ?? '')
        expect(calledUrl).toContain('maxwidth=640')
        expect(calledUrl).toContain('maxheight=360')

        fetchSpy.mockRestore()
        ;(globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver =
          previousIntersectionObserver
      },
    })
  })

  test('ensures LinkedIn iframes have a title fallback', async () => {
    await executeRender<SocialEmbedModule>({
      container,
      component: LinkedInFixture,
      moduleSpecifier: '@components/Social/Embed/webComponent',
      args: {
        props: {
          url: 'https://www.linkedin.com/embed/feed/update/urn:li:share:123',
        },
      },
      waitForReady: async element => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        const iframe = element.querySelector('iframe')
        expect(iframe).not.toBeNull()
        iframe?.removeAttribute('title')

        EmbedManager.reset()
        EmbedManager.init()
        await flushPromises()

        expect(iframe?.getAttribute('title')).toBe('Embedded LinkedIn content')
        expect(element.querySelector('.embed-linkedin-wrapper')).not.toBeNull()
        expect(element.getAttribute('aria-busy')).toBe('false')
      },
    })
  })
})
