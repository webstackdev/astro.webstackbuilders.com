/**
 * Social Share Client-side functionality
 * Handles click tracking, Mastodon modal, and Web Share API integration
 */

import { isMetaElement } from '@components/scripts/assertions/elements'
import { handleScriptError, addScriptBreadcrumb } from '@components/scripts/errors'

/**
 * Handle click event for share button
 */
function handleShareButtonClick(event: Event): void {
  const context = { scriptName: 'SocialShare', operation: 'handleClick' }
  addScriptBreadcrumb(context)

  try {
    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) return

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
      const metaDescription = document.querySelector('meta[name="description"]')
      const description = isMetaElement(metaDescription) ? metaDescription.content : ''
      navigator
        .share({
          title: document.title,
          text: description,
          url: window.location.href,
        })
        .catch(err => {
          handleScriptError(err, { scriptName: 'SocialShare', operation: 'nativeShare' })
        })
    }
  } catch (error) {
    handleScriptError(error, context)
  }
}

/**
 * Social Share for delayed initialization
 */
export class SocialShare {
  static scriptName = 'SocialShare'

  private static listeners = new WeakMap<HTMLElement, EventListener>()

  static init(): void {
    const context = { scriptName: SocialShare.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
      const shareButtons = document.querySelectorAll<HTMLElement>('.social-share__button')

      shareButtons.forEach(button => {
        try {
          const listener = handleShareButtonClick.bind(null)
          button.addEventListener('click', listener)
          this.listeners.set(button, listener)
        } catch (error) {
          handleScriptError(error, { scriptName: SocialShare.scriptName, operation: 'attachListener' })
        }
      })
    } catch (error) {
      // Share buttons are optional enhancement
      handleScriptError(error, context)
    }
  }

  static pause(): void {
    const context = { scriptName: SocialShare.scriptName, operation: 'pause' }
    addScriptBreadcrumb(context)

    try {
      const shareButtons = document.querySelectorAll<HTMLElement>('.social-share__button')

      shareButtons.forEach(button => {
        try {
          const listener = this.listeners.get(button)
          if (listener) {
            button.removeEventListener('click', listener)
          }
        } catch (error) {
          handleScriptError(error, { scriptName: SocialShare.scriptName, operation: 'removeListener' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  static resume(): void {
    this.init()
  }

  static reset(): void {
    this.pause()
    this.listeners = new WeakMap()
  }
}
