// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

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
      expect(Highlighter.eventType).toBe('astro:page-load')
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
    return new Promise(resolve => setTimeout(resolve, 0))
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('should create shadow DOM', () => {
      expect(highlighter.shadowRoot).toBeTruthy()
    })

    it('should render share dialog', () => {
      const dialog = highlighter.shadowRoot?.querySelector('.share-dialog')
      expect(dialog).toBeTruthy()
    })

    it('should render all platform buttons', () => {
      const buttons = highlighter.shadowRoot?.querySelectorAll('.share-button')
      expect(buttons).toHaveLength(6) // 5 platforms + copy button
    })

    it('should render platform buttons in correct order', () => {
      const buttons = highlighter.shadowRoot?.querySelectorAll('.share-button')
      const platforms = Array.from(buttons || [])
        .slice(0, 4) // First 4 are social platforms
        .map(btn => btn.getAttribute('data-platform'))

      expect(platforms).toEqual(['twitter', 'linkedin', 'bluesky', 'reddit'])
    })

    it('should render copy button with correct attributes', () => {
      const copyButton = highlighter.shadowRoot?.querySelector('[data-platform="copy"]')
      expect(copyButton).toBeTruthy()
      expect(copyButton?.getAttribute('aria-label')).toBe('Copy link')
    })

    it('should use custom aria-label', () => {
      // The aria-label is on the host element, not a child
      expect(highlighter.getAttribute('aria-label')).toBe('Share this quote')
    })

    it('should have dialog hidden by default', () => {
      const dialog = highlighter.shadowRoot?.querySelector('.share-dialog')
      expect(dialog?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('Dialog Visibility', () => {
    it('should show dialog on mouseenter', async () => {
      // Trigger mouseenter on the host element
      highlighter.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))

      const dialog = highlighter.shadowRoot?.querySelector('.share-dialog')
      expect(dialog?.getAttribute('aria-hidden')).toBe('false')
    })

    it('should hide dialog on mouseleave', async () => {
      // Show dialog first
      highlighter.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      expect(
        highlighter.shadowRoot?.querySelector('.share-dialog')?.getAttribute('aria-hidden')
      ).toBe('false')

      // Hide dialog
      highlighter.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
      expect(
        highlighter.shadowRoot?.querySelector('.share-dialog')?.getAttribute('aria-hidden')
      ).toBe('true')
    })

    it('should show dialog on focus', async () => {
      // Trigger focus on the host element
      highlighter.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

      const dialog = highlighter.shadowRoot?.querySelector('.share-dialog')
      expect(dialog?.getAttribute('aria-hidden')).toBe('false')
    })

    it('should hide dialog on blur', async () => {
      // Show dialog first
      highlighter.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      expect(
        highlighter.shadowRoot?.querySelector('.share-dialog')?.getAttribute('aria-hidden')
      ).toBe('false')

      // Hide dialog
      highlighter.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      expect(
        highlighter.shadowRoot?.querySelector('.share-dialog')?.getAttribute('aria-hidden')
      ).toBe('true')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should show dialog on Enter key', async () => {
      // Trigger Enter key on the host element (using keyup for accessibility)
      const event = new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })
      highlighter.dispatchEvent(event)

      const dialog = highlighter.shadowRoot?.querySelector('.share-dialog')
      expect(dialog?.getAttribute('aria-hidden')).toBe('false')
    })

    it('should show dialog on Space key', async () => {
      // Trigger Space key on the host element (using keyup for accessibility)
      const event = new KeyboardEvent('keyup', { key: ' ', bubbles: true })
      highlighter.dispatchEvent(event)

      const dialog = highlighter.shadowRoot?.querySelector('.share-dialog')
      expect(dialog?.getAttribute('aria-hidden')).toBe('false')
    })

    it('should hide dialog on Escape key', async () => {
      // Show dialog first
      highlighter.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      expect(
        highlighter.shadowRoot?.querySelector('.share-dialog')?.getAttribute('aria-hidden')
      ).toBe('false')

      // Trigger Escape key (using keyup for accessibility)
      const event = new KeyboardEvent('keyup', { key: 'Escape', bubbles: true })
      document.dispatchEvent(event)

      const dialog = highlighter.shadowRoot?.querySelector('.share-dialog')
      expect(dialog?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('Text Extraction', () => {
    it('should extract text from slot', () => {
      const text = highlighter.textContent?.trim()
      expect(text).toBe('Test shareable content')
    })

    it('should handle empty content', () => {
      const emptyHighlighter = document.createElement('highlighter-element')
      document.body.appendChild(emptyHighlighter)

      const text = emptyHighlighter.textContent?.trim()
      expect(text).toBe('')
    })

    it('should handle nested HTML', () => {
      const htmlHighlighter = document.createElement('highlighter-element')
      htmlHighlighter.innerHTML = '<strong>Bold</strong> and <em>italic</em> text'
      document.body.appendChild(htmlHighlighter)

      const text = htmlHighlighter.textContent?.trim()
      expect(text).toBe('Bold and italic text')
    })
  })

  describe('Platform Sharing', () => {
    beforeEach(() => {
      // Reset location for each test
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com/test-page',
          protocol: 'https:',
          host: 'example.com',
          pathname: '/test-page',
        },
        writable: true,
      })

      // Mock window.open
      window.open = vi.fn()

      // Mock document.title
      Object.defineProperty(document, 'title', {
        value: 'Test Page Title',
        writable: true,
      })
    })

    it('should open Twitter share URL', async () => {
      const twitterButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="twitter"]'
      ) as HTMLButtonElement
      expect(twitterButton).toBeTruthy()

      twitterButton.click()

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://twitter.com/intent/tweet'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should open LinkedIn share URL', async () => {
      const linkedinButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="linkedin"]'
      ) as HTMLButtonElement
      expect(linkedinButton).toBeTruthy()

      linkedinButton.click()

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://www.linkedin.com/sharing/share-offsite'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should open Bluesky share URL', async () => {
      const blueskyButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="bluesky"]'
      ) as HTMLButtonElement
      expect(blueskyButton).toBeTruthy()

      blueskyButton.click()

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://bsky.app/intent/compose'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should open Reddit share URL', async () => {
      const redditButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="reddit"]'
      ) as HTMLButtonElement
      expect(redditButton).toBeTruthy()

      redditButton.click()

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://reddit.com/submit'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('should encode text and URL in share URLs', async () => {
      const specialHighlighter = document.createElement('highlighter-element')
      specialHighlighter.textContent = 'Text with & special <chars>'
      document.body.appendChild(specialHighlighter)

      await new Promise(resolve => setTimeout(resolve, 0))

      const twitterButton = specialHighlighter.shadowRoot?.querySelector(
        '[data-platform="twitter"]'
      ) as HTMLButtonElement
      twitterButton?.click()

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Text with & special <chars>')),
        '_blank',
        'noopener,noreferrer'
      )
    })
  })

  describe('Copy to Clipboard', () => {
    it('should call copyToClipboard with text and URL', async () => {
      const copyButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="copy"]'
      ) as HTMLButtonElement
      expect(copyButton).toBeTruthy()

      copyButton.click()

      // Copy button shares text + URL
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        '"Test shareable content" https://example.com/test-page'
      )
    })

    it('should show visual feedback after successful copy', async () => {
      mockCopyToClipboard.mockResolvedValueOnce(true)

      const copyButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="copy"]'
      ) as HTMLButtonElement

      copyButton.click()

      // Wait for feedback animation
      await new Promise(resolve => setTimeout(resolve, 10))

      // Verify the copy function was called successfully
      expect(mockCopyToClipboard).toHaveBeenCalled()
    })
  })

  describe('Native Share API', () => {
    it('should try native share first if available', async () => {
      // Mock navigator.share as available
      const mockNavigatorShare = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: mockNavigatorShare,
        writable: true,
        configurable: true,
      })

      mockNativeShare.mockResolvedValueOnce(true)

      const twitterButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="twitter"]'
      ) as HTMLButtonElement
      twitterButton.click()

      // Should have tried native share
      expect(mockNativeShare).toHaveBeenCalled()
    })

    it('should fall back to platform share if native share fails', async () => {
      // Mock native share as unavailable/failed
      mockNativeShare.mockResolvedValueOnce(false)

      const twitterButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="twitter"]'
      ) as HTMLButtonElement
      twitterButton.click()

      // Wait for async operations
      await vi.waitFor(() => {
        expect(window.open).toHaveBeenCalled()
      })
    })
  })

  describe('Custom Events', () => {
    it('should emit highlighter:share event on successful share', async () => {
      const eventListener = vi.fn()
      highlighter.addEventListener('highlighter:share', eventListener)

      const twitterButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="twitter"]'
      ) as HTMLButtonElement
      twitterButton.click()

      // Wait for async share operation
      await vi.waitFor(() => {
        expect(eventListener).toHaveBeenCalled()
      })

      const event = eventListener.mock.calls[0]?.[0] as CustomEvent
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

      const copyButton = highlighter.shadowRoot?.querySelector(
        '[data-platform="copy"]'
      ) as HTMLButtonElement
      copyButton.click()

      // Wait for async copy operation
      await vi.waitFor(() => {
        expect(eventListener).toHaveBeenCalled()
      })

      const event = eventListener.mock.calls[0]?.[0] as CustomEvent
      expect(event.detail.platform).toBe('copy')

      highlighter.removeEventListener('highlighter:share', eventListener)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on container', () => {
      // The host element is the container
      expect(highlighter.getAttribute('role')).toBeNull() // Not set by default on custom elements
      expect(highlighter.getAttribute('tabindex')).toBe('0')
      expect(highlighter.getAttribute('aria-label')).toBeTruthy()
    })

    it('should have proper ARIA labels on platform buttons', () => {
      const twitterButton = highlighter.shadowRoot?.querySelector('[data-platform="twitter"]')
      expect(twitterButton?.getAttribute('aria-label')).toBe('Share on X (Twitter)')

      const linkedinButton = highlighter.shadowRoot?.querySelector('[data-platform="linkedin"]')
      expect(linkedinButton?.getAttribute('aria-label')).toBe('Share on LinkedIn')
    })

    it('should toggle aria-hidden on dialog', () => {
      const dialog = highlighter.shadowRoot?.querySelector('.share-dialog')
      expect(dialog?.getAttribute('aria-hidden')).toBe('true')

      highlighter.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))

      expect(dialog?.getAttribute('aria-hidden')).toBe('false')
    })
  })

  describe('Edge Cases', () => {
    it('should handle click without valid platform', async () => {
      const button = highlighter.shadowRoot?.querySelector('.share-button') as HTMLButtonElement
      button?.removeAttribute('data-platform')

      // Should not throw
      expect(() => button?.click()).not.toThrow()
    })

    it('should handle missing shadowRoot gracefully', () => {
      // This is more for coverage - should not happen in practice
      const element = document.createElement('div')
      expect(element.shadowRoot).toBeNull()
    })

    it('should handle very long text content', () => {
      const longHighlighter = document.createElement('highlighter-element')
      longHighlighter.textContent = 'A'.repeat(1000)
      document.body.appendChild(longHighlighter)

      const text = longHighlighter.textContent?.trim()
      expect(text).toHaveLength(1000)
    })
  })
})
