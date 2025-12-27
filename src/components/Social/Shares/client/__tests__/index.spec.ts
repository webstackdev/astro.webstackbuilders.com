import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
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

let SocialShareComponent: typeof import('@components/Social/Shares/index.astro').default

describe('SocialShareElement web component', () => {
  let container: AstroContainer

  beforeAll(async () => {
    const module = await import('@components/Social/Shares/index.astro')
    SocialShareComponent = module.default
  })

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
    assertion: (_context: RenderContext) => Promise<void> | void
  ) => {
    if (!SocialShareComponent) {
      throw new TestError('SocialShareComponent failed to load')
    }

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
          throw new TestError('window context is required for SocialShareElement tests')
        }

        const restoreGlobals = installBrowserGlobals(window)
        try {
          await assertion({ element, window })
        } finally {
          restoreGlobals()
        }
      },
    })
  }

  type BrowserGlobalKey = 'MouseEvent' | 'navigator'

  const installBrowserGlobals = (window: Window & typeof globalThis) => {
    const previousDescriptors: Partial<Record<BrowserGlobalKey, PropertyDescriptor | undefined>> = {
      MouseEvent: Object.getOwnPropertyDescriptor(globalThis, 'MouseEvent'),
      navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
    }

    if (window.MouseEvent) {
      Object.defineProperty(globalThis, 'MouseEvent', {
        configurable: true,
        value: window.MouseEvent,
      })
    }

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: window.navigator,
    })

    return () => restoreBrowserGlobals(previousDescriptors)
  }

  const restoreBrowserGlobals = (
    descriptors: Partial<Record<BrowserGlobalKey, PropertyDescriptor | undefined>>
  ) => {
    for (const key of Object.keys(descriptors) as BrowserGlobalKey[]) {
      const descriptor = descriptors[key]
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor)
      } else {
        delete (globalThis as Record<string, unknown>)[key]
      }
    }
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
      }
    )
  })

  test('labels the share group via aria-labelledby', async () => {
    await renderComponent(defaultProps, async ({ element }) => {
      const group = element.querySelector('[role="group"]')
      expect(group).toBeTruthy()

      const labelledBy = group?.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      expect(group?.getAttribute('aria-label')).toBeNull()

      const label = labelledBy ? element.querySelector(`#${labelledBy}`) : null
      expect(label).toBeTruthy()
      expect(label?.textContent?.trim()).toBe('Share:')
    })
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
      ;(window as Window & { openMastodonModal?: (_text: string) => void }).openMastodonModal =
        modalSpy

      const mastodonButton = element.querySelector('[data-platform="mastodon"]')
      expect(mastodonButton).toBeTruthy()

      expect(mastodonButton?.getAttribute('aria-haspopup')).toBe('dialog')
      expect(mastodonButton?.getAttribute('aria-controls')).toBe('mastodon-modal')

      mastodonButton?.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true, cancelable: true })
      )

      expect(modalSpy).toHaveBeenCalled()
      expect(modalSpy.mock.calls[0]?.[0]).toContain(defaultProps.url)
    })
  })

  test('uses Web Share API when shift+clicking a share button', async () => {
    await renderComponent(defaultProps, async ({ element, window }) => {
      const shareSpy = vi.fn().mockResolvedValue(undefined)
      ;(window.navigator as Navigator & { share?: typeof shareSpy }).share = shareSpy

      window.document.title = defaultProps.title
      const shareUrl = new URL(defaultProps.url)
      window.history.replaceState({}, '', shareUrl.pathname)
      const expectedLocation = window.location.href

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
        url: expectedLocation,
      })
    })
  })
})
