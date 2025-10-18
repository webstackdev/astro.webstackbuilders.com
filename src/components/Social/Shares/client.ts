/**
 * Social Share Client-side functionality
 * Handles click tracking, Mastodon modal, and Web Share API integration
 * Uses LoadableScript pattern for optimized loading
 */

import { LoadableScript } from '@components/Scripts/loader'

/**
 * Handle click event for share button
 */
function handleShareButtonClick(event: Event): void {
  const target = event.currentTarget as HTMLElement
  if (!target) return

  // Handle Mastodon modal buttons
  const platformId = target.dataset['platform']
  if (platformId === 'mastodon') {
    event.preventDefault()
    const shareText = target.dataset['shareText']
    const mastodonModal = (window as Window & { openMastodonModal?: (_text: string) => void })
      .openMastodonModal
    if (shareText && typeof mastodonModal === 'function') {
      mastodonModal(shareText)
    }
    return
  }

  const socialNetwork = target.getAttribute('aria-label')?.replace('Share on ', '').toLowerCase()

  // Track sharing event (integrate with your analytics)
  const windowWithGtag = window as typeof window & {
    gtag?: (_command: string, _action: string, _parameters: Record<string, unknown>) => void
  }
  if (typeof windowWithGtag.gtag !== 'undefined') {
    windowWithGtag.gtag('event', 'share', {
      method: socialNetwork,
      contentType: 'article',
      contentId: window.location.pathname,
    })
  }

  // Optional: Use Web Share API if available for native sharing
  const mouseEvent = event as MouseEvent
  if (navigator.share && mouseEvent.shiftKey) {
    event.preventDefault()
    const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement
    navigator
      .share({
        title: document.title,
        text: metaDescription?.content || '',
        url: window.location.href,
      })
      .catch(err => console.log('Error sharing:', err))
  }
}

/**
 * Social Share LoadableScript for delayed initialization
 */
export class SocialShare extends LoadableScript {
  static override scriptName = 'SocialShare'
  static override eventType = 'delayed' as const

  private static listeners = new WeakMap<HTMLElement, EventListener>()

  static override init(): void {
    const shareButtons = document.querySelectorAll<HTMLElement>('.social-share__button')

    shareButtons.forEach(button => {
      const listener = handleShareButtonClick.bind(null)
      button.addEventListener('click', listener)
      this.listeners.set(button, listener)
    })
  }

  static override pause(): void {
    const shareButtons = document.querySelectorAll<HTMLElement>('.social-share__button')

    shareButtons.forEach(button => {
      const listener = this.listeners.get(button)
      if (listener) {
        button.removeEventListener('click', listener)
      }
    })
  }

  static override resume(): void {
    this.init()
  }

  static override reset(): void {
    this.pause()
    this.listeners = new WeakMap()
  }
}
