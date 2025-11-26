/*!
 * Mastodon Integration Configuration
 *
 * SPDX-FileCopyrightText: © 2025 Kevin Brown <kevin@webstackbuilders.com>
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Mastodon share endpoint configuration.
 * Matches Share₂Fedi's ProjectPublishConfig pattern.
 */
export const mastodonConfig = {
  endpoint: 'share',
  params: {
    text: 'text',
  },
} as const

/**
 * Builds a Mastodon share URL for the given instance and text.
 *
 * @param instance - The Mastodon instance domain (e.g., "mastodon.social")
 * @param text - The text to share
 * @returns The complete share URL
 */
export function buildShareUrl(instance: string, text: string): string {
  const domain = instance.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const url = new URL(`https://${domain}/${mastodonConfig.endpoint}`)
  url.searchParams.set(mastodonConfig.params.text, text)
  return url.toString()
}
