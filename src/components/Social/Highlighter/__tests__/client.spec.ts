// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

type HighlighterShareDetail = {
  platform: string
  data?: {
    text: string
    url: string
    title: string
  }
}

const flushMicrotasks = () => new Promise<void>(resolve => setTimeout(resolve, 0))

// Mock the common utilities BEFORE importing
vi.mock('@components/scripts/errors', () => ({
  handleScriptError: vi.fn(),
  addScriptBreadcrumb: vi.fn(),
}))

vi.mock('@components/Social/common/platforms', () => ({
  copyToClipboard: vi.fn(),
  nativeShare: vi.fn(),
  getPlatform: vi.fn(),
  platforms: [
    {
      name: 'X (Twitter)',
      id: 'twitter',
      getShareUrl: ({ text, url }: { text: string; url: string }) =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      ariaLabel: 'Share on X (Twitter)',
      icon: 'twitter',
      colorClasses: 'bg-[#1DA1F2] hover:bg-[#1a91da] text-white',
    },
    {
      name: 'LinkedIn',
      id: 'linkedin',
      getShareUrl: ({ url }: { url: string }) =>
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      ariaLabel: 'Share on LinkedIn',
      icon: 'linkedin',
      colorClasses: 'bg-[#0077b5] hover:bg-[#005885] text-white',
    },
    {
      name: 'Bluesky',
      id: 'bluesky',
      getShareUrl: ({ text, url }: { text: string; url: string }) =>
        `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url}`)}`,
      ariaLabel: 'Share on Bluesky',
      icon: 'bluesky',
      colorClasses: 'bg-[#00A8E8] hover:bg-[#0087bd] text-white',
    },
    {
      name: 'Reddit',
      id: 'reddit',
      getShareUrl: ({ url, title }: { url: string; title: string }) =>
        `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      ariaLabel: 'Share on Reddit',
      icon: 'reddit',
      colorClasses: 'bg-[#FF4500] hover:bg-[#e03d00] text-white',
    },
    {
      name: 'Mastodon',
      id: 'mastodon',
      getShareUrl: () => '',
      ariaLabel: 'Share on Mastodon',
      icon: 'mastodon',
      colorClasses: 'bg-[#6364FF] hover:bg-[#5557e6] text-white',
      useModal: true,
    },
  ],
}))

import { Highlighter } from '@components/Social/Highlighter/client'
import { copyToClipboard, nativeShare } from '@components/Social/common/platforms'

// Cast mocked functions for assertions
const mockCopyToClipboard = vi.mocked(copyToClipboard)
const mockNativeShare = vi.mocked(nativeShare)

describe('Highlighter LoadableScript', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''
    vi.clearAllMocks()

    // Define custom element before each test
    if (!customElements.get('highlighter-element')) {
      Highlighter.init()
    }
  })

  afterEach(() => {
    // Clean up
    document.body.innerHTML = ''
  })

  describe('LoadableScript Interface', () => {
    it('should implement LoadableScript interface', () => {
      expect(Highlighter.scriptName).toBe('Highlighter')
      expect(typeof Highlighter.init).toBe('function')
      expect(typeof Highlighter.pause).toBe('function')
      expect(typeof Highlighter.resume).toBe('function')
      expect(typeof Highlighter.reset).toBe('function')
    })

    it('should register custom element on init', () => {
      // Element should be registered from beforeEach
      expect(customElements.get('highlighter-element')).toBeDefined()
    })

    it('should not register element twice', () => {
      const spy = vi.spyOn(customElements, 'define')
      Highlighter.init()
      expect(spy).not.toHaveBeenCalled()
    })
  })
})

describe('HighlighterElement', () => {
  let highlighter: HTMLElement
  const queryWithin = <T extends Element>(selector: string): T | null =>
    (highlighter.querySelector(selector) as T | null) ?? null

  const getWithin = <T extends Element>(selector: string): T => {
    const element = queryWithin<T>(selector)
    if (!element) {
      throw new Error(`Expected element ${selector} to exist inside Highlighter`)
    }
    return element
  }

  const getShareButton = (platform: string): HTMLButtonElement =>
    getWithin<HTMLButtonElement>(`.share-button[data-platform="${platform}"]`)

  const getShareDialog = () => getWithin<HTMLElement>('.share-dialog')
  const getTriggerButton = () => getWithin<HTMLButtonElement>('.highlighter__trigger')
  const getWrapper = () => getWithin<HTMLDivElement>('.highlighter__wrapper')
  const getHighlightContent = (element: Element = highlighter) =>
    element.querySelector<HTMLElement>('.highlighter__content')
  const getHighlightText = (element: Element = highlighter) =>
    getHighlightContent(element)?.textContent?.trim() ?? ''

  const getLatestShareEvent = (
    listener: ReturnType<typeof vi.fn>
  ): CustomEvent<HighlighterShareDetail> => {
    const calls = listener.mock.calls
    const event = calls[calls.length - 1]?.[0]
    if (!(event instanceof CustomEvent)) {
      throw new Error('Expected a CustomEvent from highlighter:share listener')
    }
    return event as CustomEvent<HighlighterShareDetail>
  }

  beforeEach(() => {
    // Reset DOM and mocks
    document.body.innerHTML = ''
    vi.clearAllMocks()

    // Initialize the custom element
    if (!customElements.get('highlighter-element')) {
      Highlighter.init()
    }

    // Create highlighter element
    highlighter = document.createElement('highlighter-element')
    highlighter.setAttribute('aria-label', 'Share this quote')
    highlighter.textContent = 'Test shareable content'
    document.body.appendChild(highlighter)

    // Wait for component to be fully connected
    return flushMicrotasks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('should render in the light DOM', () => {
      expect(highlighter.shadowRoot).toBeNull()
    })

    it('should render share dialog', () => {
      expect(getShareDialog()).toBeTruthy()
    })

    it('should render all platform buttons', () => {
      const buttons = highlighter.querySelectorAll('.share-button')
      expect(buttons).toHaveLength(6) // 5 platforms + copy button
    })

    it('should render platform buttons in correct order', () => {
      const buttons = highlighter.querySelectorAll('.share-button')
      const platforms = Array.from(buttons)
        .slice(0, 4) // First 4 are social platforms
        .map(btn => btn.getAttribute('data-platform'))

      expect(platforms).toEqual(['twitter', 'linkedin', 'bluesky', 'reddit'])
    })

    it('should render copy button with correct attributes', () => {
      const copyButton = getShareButton('copy')
      expect(copyButton.getAttribute('aria-label')).toBe('Copy link')
    })

    it('should use custom aria-label', () => {
      // The aria-label is on the host element, not a child
      expect(highlighter.getAttribute('aria-label')).toBe('Share this quote')
    })

    it('should have dialog hidden by default', () => {
      expect(getShareDialog().getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('Dialog Visibility', () => {
    it('should show dialog on mouseenter', async () => {
      // Trigger mouseenter on the host element
      highlighter.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))

      expect(getShareDialog().getAttribute('aria-hidden')).toBe('false')
    })

    it('should hide dialog on mouseleave', async () => {
      // Show dialog first
      highlighter.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      expect(getShareDialog().getAttribute('aria-hidden')).toBe('false')

      // Hide dialog
      highlighter.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
      expect(getShareDialog().getAttribute('aria-hidden')).toBe('true')
    })

    it('should show dialog on focus', async () => {
      // Trigger focus on the host element
      highlighter.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

      expect(getShareDialog().getAttribute('aria-hidden')).toBe('false')
    })

    it('should hide dialog on blur', async () => {
      // Show dialog first
      highlighter.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      expect(getShareDialog().getAttribute('aria-hidden')).toBe('false')

      // Hide dialog
      highlighter.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      expect(getShareDialog().getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should show dialog on Enter key', async () => {
      const trigger = getTriggerButton()
      const event = new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })
      trigger.dispatchEvent(event)

      expect(getShareDialog().getAttribute('aria-hidden')).toBe('false')
    })

    it('should show dialog on Space key', async () => {
      const trigger = getTriggerButton()
      const event = new KeyboardEvent('keyup', { key: ' ', bubbles: true })
      trigger.dispatchEvent(event)

      expect(getShareDialog().getAttribute('aria-hidden')).toBe('false')
    })

    it('should hide dialog on Escape key', async () => {
      // Show dialog first
      highlighter.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      expect(getShareDialog().getAttribute('aria-hidden')).toBe('false')

      // Trigger Escape key on wrapper (using keyup for accessibility)
      const wrapper = getWrapper()
      const event = new KeyboardEvent('keyup', { key: 'Escape', bubbles: true })
      wrapper.dispatchEvent(event)

      expect(getShareDialog().getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('Text Extraction', () => {
    it('should extract text from slot', () => {
      expect(getHighlightText()).toBe('Test shareable content')
    })

    it('should handle empty content', async () => {
      const emptyHighlighter = document.createElement('highlighter-element')
      document.body.appendChild(emptyHighlighter)

      await flushMicrotasks()
      expect(getHighlightText(emptyHighlighter)).toBe('')
    })

    it('should handle nested HTML', async () => {
      const htmlHighlighter = document.createElement('highlighter-element')
      htmlHighlighter.innerHTML = '<strong>Bold</strong> and <em>italic</em> text'
      document.body.appendChild(htmlHighlighter)

      await flushMicrotasks()
      expect(getHighlightText(htmlHighlighter)).toBe('Bold and italic text')
    })
  })

  describe('Platform Sharing', () => {
    let windowOpenSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      document.title = 'Test Page Title'
    })

    afterEach(() => {
      windowOpenSpy.mockRestore()
    })

    it('should open Twitter share URL', async () => {
      getShareButton('twitter').click()

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://twitter.com/intent/tweet'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should open LinkedIn share URL', async () => {
      getShareButton('linkedin').click()

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.linkedin.com/sharing/share-offsite'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should open Bluesky share URL', async () => {
      getShareButton('bluesky').click()

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://bsky.app/intent/compose'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should open Reddit share URL', async () => {
      getShareButton('reddit').click()

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://reddit.com/submit'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should encode text and URL in share URLs', async () => {
      const specialHighlighter = document.createElement('highlighter-element')
      specialHighlighter.textContent = 'Text with & special <chars>'
      document.body.appendChild(specialHighlighter)

      await flushMicrotasks()

      const twitterButton = specialHighlighter.querySelector<HTMLButtonElement>('[data-platform="twitter"]')
      if (!twitterButton) {
        throw new Error('twitter button missing on special highlighter')
      }
      twitterButton.click()

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Text with & special <chars>')),
        '_blank',
        'noopener,noreferrer'
      )
    })
  })

  describe('Copy to Clipboard', () => {
    it('should call copyToClipboard with text and URL', async () => {
      getShareButton('copy').click()

      // Copy button shares text + URL
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        `"Test shareable content" ${window.location.href}`
      )
    })

    it('should show visual feedback after successful copy', async () => {
      mockCopyToClipboard.mockResolvedValueOnce(true)

      getShareButton('copy').click()

      // Wait for feedback animation
      await new Promise(resolve => setTimeout(resolve, 10))

      // Verify the copy function was called successfully
      expect(mockCopyToClipboard).toHaveBeenCalled()
    })
  })

  describe('Native Share API', () => {
    it('should try native share first if available', async () => {
      // Mock navigator.share as available
      const mockNavigatorShare = vi
        .fn<NonNullable<Navigator['share']>>()
        .mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: mockNavigatorShare,
        writable: true,
        configurable: true,
      })

      mockNativeShare.mockResolvedValueOnce(true)

      getShareButton('twitter').click()

      // Should have tried native share
      expect(mockNativeShare).toHaveBeenCalled()
    })

    it('should fall back to platform share if native share fails', async () => {
      // Mock native share as unavailable/failed
      mockNativeShare.mockResolvedValueOnce(false)
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      getShareButton('twitter').click()

      // Wait for async operations
      await vi.waitFor(() => {
        expect(windowOpenSpy).toHaveBeenCalled()
      })

      windowOpenSpy.mockRestore()
    })
  })

  describe('Custom Events', () => {
    it('should emit highlighter:share event on successful share', async () => {
      const eventListener = vi.fn()
      highlighter.addEventListener('highlighter:share', eventListener)

      getShareButton('twitter').click()

      // Wait for async share operation
      await vi.waitFor(() => {
        expect(eventListener).toHaveBeenCalled()
      })

      const event = getLatestShareEvent(eventListener)
      expect(event.detail).toMatchObject({
        platform: 'twitter',
        data: {
          text: expect.any(String),
          url: expect.any(String),
          title: expect.any(String),
        },
      })

      highlighter.removeEventListener('highlighter:share', eventListener)
    })

    it('should emit event on copy action', async () => {
      const eventListener = vi.fn()
      highlighter.addEventListener('highlighter:share', eventListener)

      mockCopyToClipboard.mockResolvedValueOnce(true)

      getShareButton('copy').click()

      // Wait for async copy operation
      await vi.waitFor(() => {
        expect(eventListener).toHaveBeenCalled()
      })

      const event = getLatestShareEvent(eventListener)
      expect(event.detail.platform).toBe('copy')

      highlighter.removeEventListener('highlighter:share', eventListener)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on container', () => {
      // The host element is the container
      expect(highlighter.getAttribute('role')).toBeNull() // Not set by default on custom elements
      expect(highlighter.getAttribute('tabindex')).toBeNull()
      expect(highlighter.getAttribute('aria-label')).toBeTruthy()

      const trigger = getTriggerButton()
      expect(trigger.getAttribute('type')).toBe('button')
      expect(trigger.getAttribute('aria-label')).toBe('Share this quote')
    })

    it('should have proper ARIA labels on platform buttons', () => {
      expect(getShareButton('twitter').getAttribute('aria-label')).toBe('Share on X (Twitter)')
      expect(getShareButton('linkedin').getAttribute('aria-label')).toBe('Share on LinkedIn')
    })

    it('should toggle aria-hidden on dialog', () => {
      const dialog = getShareDialog()
      expect(dialog.getAttribute('aria-hidden')).toBe('true')

      highlighter.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))

      expect(dialog.getAttribute('aria-hidden')).toBe('false')
    })
  })

  describe('Edge Cases', () => {
    it('should handle click without valid platform', async () => {
      const button = getShareButton('twitter')
      button.removeAttribute('data-platform')

      // Should not throw
      expect(() => button.click()).not.toThrow()
    })

    it('should handle very long text content', async () => {
      const longHighlighter = document.createElement('highlighter-element')
      longHighlighter.textContent = 'A'.repeat(1000)
      document.body.appendChild(longHighlighter)

      await flushMicrotasks()
      expect(getHighlightText(longHighlighter)).toHaveLength(1000)
    })
  })
})
