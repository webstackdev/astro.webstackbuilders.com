/**
 * Test helper for SocialShare component
 * Generates HTML for testing social share functionality
 */

export interface MockService {
  id: string
  title: string
  description: string
}

/**
 * Mock social networks data
 */
export const mockSocialNetworks = ['twitter', 'linkedin', 'bluesky', 'mastodon'] as const

/**
 * Generate social share buttons HTML for testing
 */
export const getSocialShareHTML = (
  title = 'Test Article',
  description = 'Test description'
): string => {
  const encodedUrl = encodeURIComponent('https://example.com/test')
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${description ? `%20-%20${encodedDescription}` : ''}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    bluesky: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
    mastodon: `https://k8s.social/share?text=${encodedTitle}%20${encodedUrl}`,
  }

  const socialNetworkConfig = {
    twitter: { name: 'X (Twitter)', icon: 'twitter' },
    linkedin: { name: 'LinkedIn', icon: 'linkedin' },
    bluesky: { name: 'Bluesky', icon: 'bluesky' },
    mastodon: { name: 'Mastodon', icon: 'mastodon' },
  }

  const buttonsHTML = mockSocialNetworks
    .map(network => {
      const config = socialNetworkConfig[network]
      const shareUrl = shareUrls[network]

      // Mastodon uses button with data attributes instead of anchor
      if (network === 'mastodon') {
        return `
      <button
        type="button"
        data-platform="mastodon"
        data-share-text="${description} https://example.com/test"
        class="social-share__button inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
        aria-label="Share on ${config.name}"
      >
        <span class="hidden sm:inline">${config.name}</span>
      </button>
    `
      }

      return `
      <a
        href="${shareUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="social-share__button inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
        aria-label="Share on ${config.name}"
      >
        <span class="hidden sm:inline">${config.name}</span>
      </a>
    `
    })
    .join('')

  return `
    <div class="social-share flex flex-wrap gap-3" role="group" aria-label="Share this content">
      <span class="social-share__label text-sm font-semibold text-gray-600 mr-2 self-center">
        Share:
      </span>
      ${buttonsHTML}
    </div>
  `
}

/**
 * Setup DOM for social share testing
 */
export const setupSocialShareDOM = (title?: string, description?: string): void => {
  // Clear any existing content
  document.body.innerHTML = ''

  // Add meta description for Web Share API tests
  const metaDesc = document.createElement('meta')
  metaDesc.name = 'description'
  metaDesc.content = description || 'Test meta description'
  document.head.appendChild(metaDesc)

  // Set document title
  document.title = title || 'Test Document Title'

  // Add social share HTML
  document.body.innerHTML = getSocialShareHTML(title, description)
}
