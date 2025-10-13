/**
 * Social Share Client-side functionality
 * Handles click tracking and Web Share API integration
 */

/**
 * Setup social share button click tracking and Web Share API
 */
export const setupSocialShare = (): void => {
  const shareButtons = document.querySelectorAll<HTMLElement>('.social-share__button')

  shareButtons.forEach((button) => {
    button.addEventListener('click', (event: Event) => {
      const target = event.currentTarget as HTMLElement
      if (!target) return

      const socialNetwork = target.getAttribute('aria-label')?.replace('Share on ', '').toLowerCase()

      // Track sharing event (integrate with your analytics)
      const windowWithGtag = window as typeof window & {
        gtag?: (_command: string, _action: string, _parameters: Record<string, unknown>) => void
      }
      if (typeof windowWithGtag.gtag !== 'undefined') {
        windowWithGtag.gtag('event', 'share', {
          method: socialNetwork,
          contentType: 'article',
          contentId: window.location.pathname
        })
      }

      // Optional: Use Web Share API if available for native sharing
      const mouseEvent = event as MouseEvent
      if (navigator.share && mouseEvent.shiftKey) {
        event.preventDefault()
        const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement
        navigator.share({
          title: document.title,
          text: metaDescription?.content || '',
          url: window.location.href
        }).catch(err => console.log('Error sharing:', err))
      }
    })
  })
}