/**
 * Shared social media platform configurations for sharing
 * Used by both Highlighter and Social Shares components
 */

export interface SharePlatform {
  name: string
  /** Platform identifier for tracking/CSS classes */
  id: string
  /** Function to generate the share URL */
  getShareUrl: (_data: ShareData) => string
  /** Accessible label for screen readers */
  ariaLabel: string
  /** Icon name */
  icon: string
  /** Tailwind color classes for the button */
  colorClasses: string
  /** If true, uses modal instead of direct link */
  useModal?: boolean
}

export interface ShareData {
  /** Text content to share (e.g., highlighted quote or article title) */
  text: string
  /** URL of the current page */
  url: string
  /** Page title */
  title: string
}

/**
 * Platform configurations in priority order: X → LinkedIn → Bluesky → Reddit → Mastodon
 */
export const platforms: SharePlatform[] = [
  {
    name: 'X (Twitter)',
    id: 'twitter',
    getShareUrl: ({ text, url }) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    ariaLabel: 'Share on X (Twitter)',
    icon: 'twitter',
    colorClasses: 'bg-[#1DA1F2] hover:bg-[#1a91da] text-white',
  },
  {
    name: 'LinkedIn',
    id: 'linkedin',
    getShareUrl: ({ url }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    ariaLabel: 'Share on LinkedIn',
    icon: 'linkedin',
    colorClasses: 'bg-[#0077b5] hover:bg-[#005885] text-white',
  },
  {
    name: 'Bluesky',
    id: 'bluesky',
    getShareUrl: ({ text, url }) =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url}`)}`,
    ariaLabel: 'Share on Bluesky',
    icon: 'bluesky',
    colorClasses: 'bg-[#00A8E8] hover:bg-[#0087bd] text-white',
  },
  {
    name: 'Reddit',
    id: 'reddit',
    getShareUrl: ({ url, title }) =>
      `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    ariaLabel: 'Share on Reddit',
    icon: 'reddit',
    colorClasses: 'bg-[#FF4500] hover:bg-[#e03d00] text-white',
  },
  {
    name: 'Mastodon',
    id: 'mastodon',
    getShareUrl: () => '', // Modal handles URL generation
    ariaLabel: 'Share on Mastodon',
    icon: 'mastodon',
    colorClasses: 'bg-[#6364FF] hover:bg-[#5557e6] text-white',
    useModal: true,
  },
]

/**
 * Get platform configuration by ID
 */
export function getPlatform(id: string): SharePlatform | undefined {
  return platforms.find(p => p.id === id)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}

/**
 * Use Native Share API if available (mobile-first)
 */
export async function nativeShare(data: ShareData): Promise<boolean> {
  if (!navigator.share) {
    return false
  }

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    })
    return true
  } catch (err) {
    // AbortError means user cancelled, which is fine
    if ((err as Error).name !== 'AbortError') {
      console.error('Native share failed:', err)
    }
    return false
  }
}
