import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import HighlighterFixture from '@components/Social/Highlighter/client/__fixtures__/index.fixture.astro'
import type { HighlighterElement } from '@components/Social/Highlighter/client/index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { copyToClipboard, nativeShare } from '@components/Social/common'
import { MastodonModal } from '@components/Social/Mastodon/client'
import * as elementUtils from '@components/scripts/utils'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

type MockPlatform = {
  id: string
  ariaLabel: string
  icon: string
  getShareUrl: (_args: { text?: string; url?: string }) => string
}

// Use vi.hoisted so the mock data exists before mocked modules evaluate
const mockPlatforms = vi.hoisted<MockPlatform[]>(() => [
  {
    id: 'twitter',
    ariaLabel: 'Share on Twitter',
    icon: 'twitter',
    getShareUrl: ({ text, url }) =>
      `https://social.example/twitter?text=${encodeURIComponent(text ?? '')}&url=${encodeURIComponent(url ?? '')}`,
  },
  {
    id: 'linkedin',
    ariaLabel: 'Share on LinkedIn',
    icon: 'linkedin',
    getShareUrl: ({ url }) => `https://social.example/linkedin?url=${encodeURIComponent(url ?? '')}`,
  },
  {
    id: 'bluesky',
    ariaLabel: 'Share on Bluesky',
    icon: 'bluesky',
    getShareUrl: ({ text, url }) =>
      `https://social.example/bluesky?text=${encodeURIComponent(`${text ?? ''} ${url ?? ''}`.trim())}`,
  },
  {
    id: 'mastodon',
    ariaLabel: 'Share on Mastodon',
    icon: 'mastodon',
    getShareUrl: ({ text }) => `https://social.example/mastodon?text=${encodeURIComponent(text ?? '')}`,
  },
])

vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: vi.fn(),
  handleScriptError: vi.fn(),
}))

vi.mock('@components/Social/common', () => ({
  platforms: mockPlatforms,
  copyToClipboard: vi.fn().mockResolvedValue(true),
  nativeShare: vi.fn().mockResolvedValue(false),
}))

vi.mock('@components/Social/Mastodon/client', () => ({
  MastodonModal: {
    openModal: vi.fn(),
  },
}))

type HighlighterModule = WebComponentModule<HighlighterElement>
const mockCopyToClipboard = vi.mocked(copyToClipboard)
const mockNativeShare = vi.mocked(nativeShare)
const mockMastodonModal = vi.mocked(MastodonModal)
const originalDefineCustomElement = elementUtils.defineCustomElement
const defineCustomElementSpy = vi.spyOn(elementUtils, 'defineCustomElement')

const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0))
const defaultProps = { ariaLabel: 'Share this quote', content: 'Test shareable content' }

type RenderHighlighterContext = {
  element: HighlighterElement
  window: Window & typeof globalThis
}

type RenderHighlighterAssertion = (_context: RenderHighlighterContext) => Promise<void> | void

const waitForShareDialog = async (element: HighlighterElement): Promise<void> => {
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (element.querySelector('.share-dialog')) {
      return
    }
    await flushMicrotasks()
  }
  process.stdout.write(`Highlighter markup before failure: ${element.outerHTML}\n`)
  throw new TestError('HighlighterElement failed to render the share dialog')
}

const getShareButton = (element: HighlighterElement, platformId: string): HTMLButtonElement => {
  const button = element.querySelector<HTMLButtonElement>(`.share-button[data-platform="${platformId}"]`)
  if (!button) {
    throw new TestError(`Missing share button for ${platformId}`)
  }
  return button
}

const renderHighlighter = async (
  assertion: RenderHighlighterAssertion,
  overrides: Partial<typeof defaultProps> = {}
) => {
  const container = await AstroContainer.create()
  await executeRender<HighlighterModule>({
    container,
    component: HighlighterFixture,
    moduleSpecifier: '@components/Social/Highlighter/client/index',
    args: { props: { ...defaultProps, ...overrides } },
    waitForReady: async (element) => {
      try {
        await element.updateComplete
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('class fields')) {
          throw error
        }
      }
    },
    assert: async ({ element, window, renderResult, module }) => {
      process.stdout.write(`Highlighter server render: ${renderResult}\n`)
      if (!window) {
        throw new TestError('Highlighter tests require a window instance')
      }
      if (!window.customElements.get('highlighter-element')) {
        throw new TestError('highlighter-element is not defined in customElements registry')
      }
      if (!(element instanceof module.componentCtor)) {
        throw new TestError('Rendered element is not an instance of HighlighterElement')
      }
      await flushMicrotasks()
      const performUpdate = (element as HighlighterElement & { performUpdate?: () => Promise<void> }).performUpdate
      if (performUpdate) {
        await performUpdate.call(element)
      } else {
        element.requestUpdate()
      }
      await waitForShareDialog(element)
      await assertion({ element, window: window as Window & typeof globalThis })
    },
  })
}

describe('HighlighterElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders share dialog and buttons in the light DOM', async () => {
    await renderHighlighter(async ({ element }) => {
      expect(element.shadowRoot).toBeNull()
      expect(element.querySelector('.share-dialog')).not.toBeNull()
      expect(element.querySelectorAll('.share-button')).toHaveLength(mockPlatforms.length + 1)
      expect(element.getAttribute('aria-label')).toBe(defaultProps.ariaLabel)
    })
  })

  test('toggles dialog visibility on hover', async () => {
    await renderHighlighter(async ({ element, window }) => {
      const dialog = element.querySelector('.share-dialog') as HTMLElement | null
      expect(dialog?.getAttribute('aria-hidden')).toBe('true')

      element.dispatchEvent(new window.MouseEvent('mouseenter', { bubbles: true }))
      expect(dialog?.getAttribute('aria-hidden')).toBe('false')

      element.dispatchEvent(new window.MouseEvent('mouseleave', { bubbles: true }))
      expect(dialog?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  const getLastShareEvent = (listener: ReturnType<typeof vi.fn>) =>
    listener.mock.calls.at(-1)?.[0] as CustomEvent<{ platform: string }> | undefined

  test('copy button copies highlighted text and emits event', async () => {
    await renderHighlighter(async ({ element, window }) => {
      const shareListener = vi.fn()
      element.addEventListener('highlighter:share', shareListener)

      mockCopyToClipboard.mockResolvedValueOnce(true)
      getShareButton(element, 'copy').click()

      await flushMicrotasks()

      expect(mockCopyToClipboard).toHaveBeenCalledWith(`"${defaultProps.content}" ${window.location.href}`)
      expect(shareListener).toHaveBeenCalledTimes(1)
      expect(getLastShareEvent(shareListener)?.detail.platform).toBe('copy')

      element.removeEventListener('highlighter:share', shareListener)
    })
  })

  test('opens share URL when native share is unavailable', async () => {
    await renderHighlighter(async ({ element, window }) => {
      mockNativeShare.mockResolvedValueOnce(false)
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)

      getShareButton(element, 'twitter').click()
      await flushMicrotasks()

      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('https://social.example/twitter'), '_blank', 'noopener,noreferrer')
      openSpy.mockRestore()
    })
  })

  test('opens Mastodon modal and emits share event', async () => {
    await renderHighlighter(async ({ element }) => {
      const shareListener = vi.fn()
      element.addEventListener('highlighter:share', shareListener)

      getShareButton(element, 'mastodon').click()
      await flushMicrotasks()

      expect(mockMastodonModal.openModal).toHaveBeenCalledWith(expect.stringContaining(defaultProps.content))
      expect(getLastShareEvent(shareListener)?.detail.platform).toBe('mastodon')

      element.removeEventListener('highlighter:share', shareListener)
    })
  })
})

describe('Highlighter web component module contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  beforeAll(() => {
    defineCustomElementSpy.mockImplementation(() => undefined)
  })

  afterAll(() => {
    defineCustomElementSpy.mockImplementation((tagName, ctor) => originalDefineCustomElement(tagName, ctor))
  })

  test('exposes metadata for registration', async () => {
    await withJsdomEnvironment(async () => {
      const module = await import('@components/Social/Highlighter/client/index')
      expect(module.webComponentModule.registeredName).toBe('highlighter-element')
      expect(module.webComponentModule.componentCtor).toBe(module.HighlighterElement)
      expect(module.webComponentModule.registerWebComponent).toBe(module.registerHighlighterWebComponent)
    })
  })

  test('registers the custom element when window exists', async () => {
    await withJsdomEnvironment(async () => {
      const { registerHighlighterWebComponent, HighlighterElement } = await import('@components/Social/Highlighter/client/index')
      const uniqueTag = `highlighter-element-${Math.random().toString(36).slice(2)}`
      registerHighlighterWebComponent(uniqueTag)
      expect(defineCustomElementSpy).toHaveBeenCalledWith(uniqueTag, HighlighterElement)
    })
  })

  test('skips registration on the server', async () => {
    await withJsdomEnvironment(async () => {
      const { registerHighlighterWebComponent } = await import('@components/Social/Highlighter/client/index')
      const globalWithWindow = globalThis as typeof globalThis & { window?: Window }
      const originalWindow = globalWithWindow.window
      delete globalWithWindow.window

      try {
        registerHighlighterWebComponent('highlighter-element-server')
        expect(defineCustomElementSpy).not.toHaveBeenCalled()
      } finally {
        if (originalWindow) {
          globalWithWindow.window = originalWindow
        }
      }
    })
  })
})

