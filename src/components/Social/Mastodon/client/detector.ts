/*!
 * Adapted from Share₂Fedi
 * https://github.com/kytta/share2fedi
 *
 * SPDX-FileCopyrightText: © 2023 Nikita Karamov <me@kytta.dev>
 * SPDX-FileCopyrightText: © 2025 Kevin Brown <kevin@webstackbuilders.com>
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Adds missing "https://" and ending slash to the URL
 */
export function normalizeURL(url: string): string {
  let normalized = url
  if (!(normalized.startsWith('https://') || normalized.startsWith('http://'))) {
    normalized = 'https://' + normalized
  }
  if (!normalized.endsWith('/')) {
    normalized += '/'
  }
  return normalized
}

/**
 * Extracts domain from URL string or URL object
 */
export function getUrlDomain(url: string | URL): string {
  let urlString = url
  if (typeof urlString === 'string') {
    urlString = urlString.trim()

    if (!/^https?:\/\//.test(urlString)) {
      urlString = `https://${urlString}`
    }
  }

  return new URL(urlString).host
}

interface NodeInfoList {
  links: {
    rel: string
    href: string
  }[]
}

interface NodeInfo {
  software: {
    name: string
    version: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Detects the Fediverse software running on a domain using the NodeInfo protocol.
 * Checks /.well-known/nodeinfo for supported schema versions (1.0, 1.1, 2.0, 2.1).
 *
 * @param domain - The domain to check (e.g., "mastodon.social")
 * @returns The software name if detected (e.g., "mastodon"), undefined otherwise
 */
export async function getSoftwareName(domain: string): Promise<string | undefined> {
  const nodeInfoListUrl = new URL('/.well-known/nodeinfo', normalizeURL(domain))

  let nodeInfoList: NodeInfoList
  try {
    const nodeInfoListResponse = await fetch(nodeInfoListUrl)
    nodeInfoList = (await nodeInfoListResponse.json()) as NodeInfoList
  } catch (error) {
    console.error("Could not fetch '.well-known/nodeinfo':", error)
    return undefined
  }

  for (const link of nodeInfoList.links) {
    if (
      /^http:\/\/nodeinfo\.diaspora\.software\/ns\/schema\/(1\.0|1\.1|2\.0|2\.1)/.test(link.rel)
    ) {
      try {
        const nodeInfoResponse = await fetch(link.href)
        const nodeInfo = (await nodeInfoResponse.json()) as NodeInfo
        return nodeInfo.software.name
      } catch (error) {
        console.error('Could not fetch nodeinfo:', error)
        continue
      }
    }
  }

  // not found
  console.warn('No NodeInfo found for domain:', domain)
  return undefined
}

/**
 * Checks if a domain is a Mastodon instance.
 * This includes Mastodon flavours like Hometown, Fedibird, and GlitchCafé.
 *
 * @param domain - The domain to check
 * @returns True if the domain runs Mastodon or a compatible flavour
 */
export async function isMastodonInstance(domain: string): Promise<boolean> {
  const softwareName = await getSoftwareName(domain)
  if (!softwareName) {
    return false
  }

  // Mastodon and common flavours
  const mastodonProjects = ['mastodon', 'hometown', 'fedibird', 'glitchcafe']
  return mastodonProjects.includes(softwareName.toLowerCase())
}
