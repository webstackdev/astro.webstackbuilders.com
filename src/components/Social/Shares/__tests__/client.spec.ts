/**
 * Unit tests for SocialShare client functionality
 * Tests the setupSocialShare function and analytics integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setupSocialShareDOM } from './testHelper'

// Mock gtag function
const mockGtag = vi.fn()

// Mock navigator.share
const mockShare = vi.fn()

describe('Social Share Client', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Setup fresh DOM for each test
    setupSocialShareDOM()

    // Mock window.gtag
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true
    })

    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      value: mockShare.mockResolvedValue(undefined),
      writable: true
    })

    // Mock console.log to avoid test output clutter
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = ''
    document.head.innerHTML = ''

    // Restore console.log
    vi.restoreAllMocks()
  })

  describe('setupSocialShare', () => {
    it('should find and attach event listeners to social share buttons', async () => {
      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const shareButtons = document.querySelectorAll('.social-share__button')
      expect(shareButtons).toHaveLength(4) // twitter, linkedin, bluesky, mastodon
    })

    it('should call gtag when share button is clicked', async () => {
      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const twitterButton = document.querySelector('[aria-label="Share on X (Twitter)"]') as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Simulate click
      twitterButton.click()

      expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
        method: 'x (twitter)',
        contentType: 'article',
        contentId: '/'
      })
    })

    it('should not call gtag if gtag is undefined', async () => {
      // Override gtag to be undefined for this test
      const windowWithGtag = window as typeof window & { gtag?: unknown }
      const originalGtag = windowWithGtag.gtag
      windowWithGtag.gtag = undefined

      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const linkedInButton = document.querySelector('[aria-label="Share on LinkedIn"]') as HTMLElement
      expect(linkedInButton).toBeTruthy()

      // Simulate click
      linkedInButton.click()

      expect(mockGtag).not.toHaveBeenCalled()

      // Restore original gtag
      windowWithGtag.gtag = originalGtag
    })

    it('should extract social network name from aria-label', async () => {
      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const blueskyButton = document.querySelector('[aria-label="Share on Bluesky"]') as HTMLElement
      expect(blueskyButton).toBeTruthy()

      // Simulate click
      blueskyButton.click()

      expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
        method: 'bluesky',
        contentType: 'article',
        contentId: '/'
      })
    })

    it('should use Web Share API when shift+click and navigator.share is available', async () => {
      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const mastodonButton = document.querySelector('[aria-label="Share on Mastodon"]') as HTMLElement
      expect(mastodonButton).toBeTruthy()

      // Create a shift+click event
      const shiftClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        shiftKey: true
      })

      // Mock preventDefault
      const preventDefaultSpy = vi.spyOn(shiftClickEvent, 'preventDefault')

      // Dispatch the event
      mastodonButton.dispatchEvent(shiftClickEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Document Title',
        text: 'Test meta description',
        url: 'http://localhost:3000/'
      })
    })

    it('should not use Web Share API for regular clicks', async () => {
      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const twitterButton = document.querySelector('[aria-label="Share on X (Twitter)"]') as HTMLElement
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

      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const twitterButton = document.querySelector('[aria-label="Share on X (Twitter)"]') as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Shift+click to trigger Web Share API
      const shiftClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        shiftKey: true
      })

      twitterButton.dispatchEvent(shiftClickEvent)

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Document Title',
        text: '', // Empty string when meta description is missing
        url: 'http://localhost:3000/'
      })
    })

    it('should handle Web Share API errors gracefully', async () => {
      // Mock navigator.share to reject
      const shareError = new Error('Share failed')
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockRejectedValue(shareError),
        writable: true
      })

      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const twitterButton = document.querySelector('[aria-label="Share on X (Twitter)"]') as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Shift+click to trigger Web Share API
      const shiftClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        shiftKey: true
      })

      twitterButton.dispatchEvent(shiftClickEvent)

      // Wait for the promise rejection to be handled
      await new Promise(resolve => setTimeout(resolve, 10))

      // Should log the error but not throw
      expect(console.log).toHaveBeenCalledWith('Error sharing:', shareError)
    })

    it('should handle missing aria-label gracefully', async () => {
      const { setupSocialShare } = await import('../client')

      // Create a button without aria-label
      const buttonWithoutLabel = document.createElement('a')
      buttonWithoutLabel.className = 'social-share__button'
      buttonWithoutLabel.textContent = 'Share'
      document.body.appendChild(buttonWithoutLabel)

      setupSocialShare()

      // Click the button without aria-label
      buttonWithoutLabel.click()

      // Should still call gtag but with undefined method
      expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
        method: undefined,
        contentType: 'article',
        contentId: '/'
      })
    })

    it('should handle missing event target gracefully', async () => {
      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const twitterButton = document.querySelector('[aria-label="Share on X (Twitter)"]') as HTMLElement
      expect(twitterButton).toBeTruthy()

      // Create an event without a valid currentTarget
      const customEvent = new Event('click', { bubbles: true })
      Object.defineProperty(customEvent, 'currentTarget', {
        value: null,
        writable: true
      })

      // This should not throw an error
      expect(() => {
        twitterButton.dispatchEvent(customEvent)
      }).not.toThrow()

      // gtag should not be called since target is null
      expect(mockGtag).not.toHaveBeenCalled()
    })
  })

  describe('Integration with different social networks', () => {
    it('should handle all supported social networks correctly', async () => {
      const { setupSocialShare } = await import('../client')

      setupSocialShare()

      const networks = [
        { selector: '[aria-label="Share on X (Twitter)"]', expected: 'x (twitter)' },
        { selector: '[aria-label="Share on LinkedIn"]', expected: 'linkedin' },
        { selector: '[aria-label="Share on Bluesky"]', expected: 'bluesky' },
        { selector: '[aria-label="Share on Mastodon"]', expected: 'mastodon' }
      ]

      networks.forEach(({ selector, expected }) => {
        const button = document.querySelector(selector) as HTMLElement
        expect(button).toBeTruthy()

        button.click()

        expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
          method: expected,
          contentType: 'article',
          contentId: '/'
        })
      })

      expect(mockGtag).toHaveBeenCalledTimes(4)
    })
  })
})