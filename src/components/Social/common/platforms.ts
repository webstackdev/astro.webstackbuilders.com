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
    name: 'X',
    id: 'x',
    getShareUrl: ({ text, url }) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    ariaLabel: 'Share on X',
    icon: 'x',
    colorClasses: 'bg-x hover:bg-x-active text-white',
  },
  {
    name: 'LinkedIn',
    id: 'linkedin',
    getShareUrl: ({ url }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    ariaLabel: 'Share on LinkedIn',
    icon: 'linkedin',
    colorClasses: 'bg-linkedin hover:bg-linkedin-active text-white',
  },
  {
    name: 'Bluesky',
    id: 'bluesky',
    getShareUrl: ({ text, url }) =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url}`)}`,
    ariaLabel: 'Share on Bluesky',
    icon: 'bluesky',
    colorClasses: 'bg-bluesky hover:bg-bluesky-active text-white',
  },
  {
    name: 'Reddit',
    id: 'reddit',
    getShareUrl: ({ url, title }) =>
      `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    ariaLabel: 'Share on Reddit',
    icon: 'reddit',
    colorClasses: 'bg-reddit hover:bg-reddit-active text-white',
  },
  {
    name: 'Mastodon',
    id: 'mastodon',
    getShareUrl: () => '', // Modal handles URL generation
    ariaLabel: 'Share on Mastodon',
    icon: 'mastodon',
    colorClasses: 'bg-mastodon hover:bg-mastodon-active text-white',
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
    const nav = (globalThis as unknown as { navigator?: Navigator }).navigator
    const clipboard = nav?.clipboard
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      return false
    }

    await clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Use Native Share API if available (mobile-first)
 */
export async function nativeShare(data: ShareData): Promise<boolean> {
  const nav = (globalThis as unknown as { navigator?: Navigator }).navigator
  if (!nav || typeof nav.share !== 'function') {
    return false
  }

  try {
    await nav.share({
      title: data.title,
      text: data.text,
      url: data.url,
    })
    return true
  } catch {
    // AbortError means user cancelled, which is fine
    return false
  }
}
