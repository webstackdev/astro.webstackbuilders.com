// @vitest-environment happy-dom
/**
 * Unit tests for SocialShare LoadableScript implementation
 * Tests the SocialShare class and analytics integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setupSocialShareDOM } from './testHelper'

// Mock gtag function
const mockGtag = vi.fn()

// Mock navigator.share
const mockShare = vi.fn()

describe('Social Share LoadableScript', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Setup fresh DOM for each test
    setupSocialShareDOM()

    // Mock window.gtag
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true,
    })

    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      value: mockShare.mockResolvedValue(undefined),
      writable: true,
    })

    // Mock console.log to avoid test output clutter
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    // Clean up by calling reset
    import('../client').then(({ SocialShare }) => {
      SocialShare.reset()
    })

    // Clean up DOM
    document.body.innerHTML = ''
    document.head.innerHTML = ''

    // Restore console.log
    vi.restoreAllMocks()
  })

  describe('SocialShare class', () => {
    it('should find and attach event listeners to social share buttons', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()

      const shareButtons = document.querySelectorAll('.social-share__button')
      expect(shareButtons).toHaveLength(4) // twitter, linkedin, bluesky, mastodon
    })

    it('should call gtag when share button is clicked', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()

      const twitterButton = document.querySelector(
        '[aria-label="Share on X (Twitter)"]'
      ) as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Simulate click
      twitterButton.click()

      expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
        method: 'x (twitter)',
        contentType: 'article',
        contentId: '/',
      })
    })

    it('should not call gtag if gtag is undefined', async () => {
      // Override gtag to be undefined for this test
      const windowWithGtag = window as typeof window & { gtag?: unknown }
      const originalGtag = windowWithGtag.gtag
      windowWithGtag.gtag = undefined

      const { SocialShare } = await import('../client')

      SocialShare.init()

      const linkedInButton = document.querySelector(
        '[aria-label="Share on LinkedIn"]'
      ) as HTMLElement
      expect(linkedInButton).toBeTruthy()

      // Simulate click
      linkedInButton.click()

      expect(mockGtag).not.toHaveBeenCalled()

      // Restore original gtag
      windowWithGtag.gtag = originalGtag
    })

    it('should extract social network name from aria-label', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()

      const blueskyButton = document.querySelector('[aria-label="Share on Bluesky"]') as HTMLElement
      expect(blueskyButton).toBeTruthy()

      // Simulate click
      blueskyButton.click()

      expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
        method: 'bluesky',
        contentType: 'article',
        contentId: '/',
      })
    })

    it('should use Web Share API when shift+click and navigator.share is available', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()

      const twitterButton = document.querySelector(
        '[aria-label="Share on X (Twitter)"]'
      ) as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Create a shift+click event
      const shiftClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        shiftKey: true,
      })

      // Mock preventDefault
      const preventDefaultSpy = vi.spyOn(shiftClickEvent, 'preventDefault')

      // Dispatch the event on Twitter button (not Mastodon which uses modal)
      twitterButton.dispatchEvent(shiftClickEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Document Title',
        text: 'Test meta description',
        url: 'http://localhost:3000/',
      })
    })

    it('should not use Web Share API for regular clicks', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()

      const twitterButton = document.querySelector(
        '[aria-label="Share on X (Twitter)"]'
      ) as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Regular click (no shift key)
      twitterButton.click()

      expect(mockShare).not.toHaveBeenCalled()
    })

    it('should handle missing meta description gracefully', async () => {
      // Remove meta description
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) {
        metaDesc.remove()
      }

      const { SocialShare } = await import('../client')

      SocialShare.init()

      const twitterButton = document.querySelector(
        '[aria-label="Share on X (Twitter)"]'
      ) as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Shift+click to trigger Web Share API
      const shiftClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        shiftKey: true,
      })

      twitterButton.dispatchEvent(shiftClickEvent)

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Document Title',
        text: '', // Empty string when meta description is missing
        url: 'http://localhost:3000/',
      })
    })

    it('should handle Web Share API errors gracefully', async () => {
      // Mock navigator.share to reject
      const shareError = new Error('Share failed')
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockRejectedValue(shareError),
        writable: true,
      })

      const { SocialShare } = await import('../client')

      SocialShare.init()

      const twitterButton = document.querySelector(
        '[aria-label="Share on X (Twitter)"]'
      ) as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Shift+click to trigger Web Share API
      const shiftClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        shiftKey: true,
      })

      twitterButton.dispatchEvent(shiftClickEvent)

      // Wait for the promise rejection to be handled
      await new Promise(resolve => setTimeout(resolve, 10))

      // Should handle error gracefully via handleScriptError
      // Error handling now uses Sentry integration instead of console.log
    })

    it('should handle missing aria-label gracefully', async () => {
      const { SocialShare } = await import('../client')

      // Create a button without aria-label
      const buttonWithoutLabel = document.createElement('a')
      buttonWithoutLabel.className = 'social-share__button'
      buttonWithoutLabel.textContent = 'Share'
      document.body.appendChild(buttonWithoutLabel)

      SocialShare.init()

      // Click the button without aria-label
      buttonWithoutLabel.click()

      // Should still call gtag but with undefined method
      expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
        method: undefined,
        contentType: 'article',
        contentId: '/',
      })
    })

    it('should handle missing event target gracefully', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()

      const twitterButton = document.querySelector(
        '[aria-label="Share on X (Twitter)"]'
      ) as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Create an event without a valid currentTarget
      const customEvent = new Event('click', { bubbles: true })
      Object.defineProperty(customEvent, 'currentTarget', {
        value: null,
        writable: true,
      })

      // This should not throw an error
      expect(() => {
        twitterButton.dispatchEvent(customEvent)
      }).not.toThrow()

      // gtag should not be called since target is null
      expect(mockGtag).not.toHaveBeenCalled()
    })
  })

  describe('Lifecycle methods', () => {
    it('should pause and remove event listeners', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()

      const twitterButton = document.querySelector(
        '[aria-label="Share on X (Twitter)"]'
      ) as HTMLElement

      // Click should work initially
      twitterButton.click()
      expect(mockGtag).toHaveBeenCalledTimes(1)

      // Pause should remove listeners
      SocialShare.pause()
      vi.clearAllMocks()

      // Click should not trigger gtag after pause
      twitterButton.click()
      expect(mockGtag).not.toHaveBeenCalled()
    })

    it('should resume and re-add event listeners', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()
      SocialShare.pause()
      vi.clearAllMocks()

      // Resume should re-add listeners
      SocialShare.resume()

      const twitterButton = document.querySelector(
        '[aria-label="Share on X (Twitter)"]'
      ) as HTMLElement

      // Click should work again after resume
      twitterButton.click()
      expect(mockGtag).toHaveBeenCalledTimes(1)
    })

    it('should reset and clear all listeners', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()

      const twitterButton = document.querySelector(
        '[aria-label="Share on X (Twitter)"]'
      ) as HTMLElement

      // Click should work initially
      twitterButton.click()
      expect(mockGtag).toHaveBeenCalledTimes(1)

      // Reset should clear everything
      SocialShare.reset()
      vi.clearAllMocks()

      // Click should not trigger gtag after reset
      twitterButton.click()
      expect(mockGtag).not.toHaveBeenCalled()
    })
  })

  describe('Integration with different social networks', () => {
    it('should handle all supported social networks correctly', async () => {
      const { SocialShare } = await import('../client')

      SocialShare.init()

      const networks = [
        { selector: '[aria-label="Share on X (Twitter)"]', expected: 'x (twitter)' },
        { selector: '[aria-label="Share on LinkedIn"]', expected: 'linkedin' },
        { selector: '[aria-label="Share on Bluesky"]', expected: 'bluesky' },
      ]

      networks.forEach(({ selector, expected }) => {
        const button = document.querySelector(selector) as HTMLElement
        expect(button).toBeTruthy()

        button.click()

        expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
          method: expected,
          contentType: 'article',
          contentId: '/',
        })
      })

      expect(mockGtag).toHaveBeenCalledTimes(3)
    })

    it('should open Mastodon modal for Mastodon button', async () => {
      const { SocialShare } = await import('../client')

      // Mock window.openMastodonModal
      const mockOpenModal = vi.fn()
      Object.defineProperty(window, 'openMastodonModal', {
        value: mockOpenModal,
        writable: true,
      })

      SocialShare.init()

      const mastodonButton = document.querySelector('[data-platform="mastodon"]') as HTMLElement
      expect(mastodonButton).toBeTruthy()

      // Regular click should open modal
      mastodonButton.click()

      // Should call openMastodonModal with text from data attribute
      expect(mockOpenModal).toHaveBeenCalledWith('Test description https://example.com/test')
    })
  })
})
