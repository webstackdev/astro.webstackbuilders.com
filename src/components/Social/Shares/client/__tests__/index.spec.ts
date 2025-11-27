// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SocialShareComponent from '@components/Social/Shares/index.astro'
import type { SocialShareElement } from '@components/Social/Shares/client/index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type SocialShareModule = WebComponentModule<SocialShareElement>

interface RenderContext {
  element: SocialShareElement
  window: Window & typeof globalThis
}

type ComponentProps = {
  url: string
  title: string
  description?: string
  socialNetworks?: ('twitter' | 'linkedin' | 'bluesky' | 'reddit' | 'mastodon')[]
}

describe('SocialShareElement web component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const defaultProps: ComponentProps = {
    url: 'https://example.com/article',
    title: 'Demo article',
    description: 'Example summary',
  }

  const renderComponent = async (
    props: ComponentProps = defaultProps,
    assertion: (_context: RenderContext) => Promise<void> | void,
  ) => {
    await executeRender<SocialShareModule>({
      container,
      component: SocialShareComponent,
      moduleSpecifier: '@components/Social/Shares/client/index',
      args: {
        props,
      },
      waitForReady: async (element: SocialShareElement) => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        if (!window) {
          throw new Error('window context is required for SocialShareElement tests')
        }

        ;(globalThis as typeof globalThis & { MouseEvent?: typeof window.MouseEvent }).MouseEvent =
          window.MouseEvent
        ;(globalThis as typeof globalThis & { navigator?: Navigator }).navigator = window.navigator

        await assertion({ element, window })
      },
    })
  }

  test('renders buttons for the requested social networks', async () => {
    await renderComponent(
      {
        ...defaultProps,
        socialNetworks: ['twitter', 'linkedin'],
      },
      async ({ element }) => {
        const buttons = element.querySelectorAll('.social-share__button')
        expect(buttons).toHaveLength(2)
        expect(element.querySelector('[aria-label="Share on LinkedIn"]')).toBeTruthy()
      },
    )
  })

  test('sends analytics event when sharing via standard button', async () => {
    await renderComponent(defaultProps, async ({ element, window }) => {
      const windowWithAnalytics = window as typeof window & {
        gtag?: (_command: string, _action: string, _parameters: Record<string, unknown>) => void
      }

      const gtagSpy = vi.fn()
      windowWithAnalytics.gtag = gtagSpy

      const twitterButton = element.querySelector('[aria-label="Share on X (Twitter)"]')
      expect(twitterButton).toBeTruthy()

      twitterButton?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

      expect(gtagSpy).toHaveBeenCalledWith('event', 'share', {
        method: 'x (twitter)',
        contentType: 'article',
        contentId: '/',
      })
    })
  })

  test('opens Mastodon modal for Mastodon platform', async () => {
    await renderComponent(defaultProps, async ({ element, window }) => {
      const modalSpy = vi.fn()
      ;(window as Window & { openMastodonModal?: (_text: string) => void }).openMastodonModal = modalSpy

      const mastodonButton = element.querySelector('[data-platform="mastodon"]')
      expect(mastodonButton).toBeTruthy()

      mastodonButton?.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))

      expect(modalSpy).toHaveBeenCalled()
      expect(modalSpy.mock.calls[0]?.[0]).toContain(defaultProps.url)
    })
  })

  test('uses Web Share API when shift+clicking a share button', async () => {
    await renderComponent(defaultProps, async ({ element, window }) => {
      const shareSpy = vi.fn().mockResolvedValue(undefined)
      ;(window.navigator as Navigator & { share?: typeof shareSpy }).share = shareSpy

      const metaDescription = window.document.createElement('meta')
      metaDescription.name = 'description'
      metaDescription.content = 'Meta description copy'
      window.document.head.appendChild(metaDescription)

      const twitterButton = element.querySelector('[aria-label="Share on X (Twitter)"]')
      expect(twitterButton).toBeTruthy()

      const shiftClick = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        shiftKey: true,
      })

      twitterButton?.dispatchEvent(shiftClick)
      expect(shareSpy).toHaveBeenCalledWith({
        title: defaultProps.title,
        text: 'Meta description copy',
        url: defaultProps.url,
      })
    })
  })
})

