import type { AstroGlobal } from 'astro'
import { getSiteUrl } from '@lib/config/siteUrlServer'

const DEFAULT_SOCIAL_SLUG = 'home'

type SiteInput = URL | string | Pick<AstroGlobal, 'site' | 'url'> | undefined

const normalizeSocialSlug = (rawPath?: string | null): string => {
  if (!rawPath) {
    return DEFAULT_SOCIAL_SLUG
  }

  let workingPath = rawPath.trim()
  if (!workingPath) {
    return DEFAULT_SOCIAL_SLUG
  }

  try {
    const asUrl = new URL(workingPath)
    workingPath = decodeURIComponent(asUrl.pathname)
  } catch {
    // Ignore parse errors for relative paths
  }

  const withoutEdges = workingPath.replace(/^\/+/u, '').replace(/\/+$/u, '').replace(/\/+/gu, '/')
  const collapsedSegments = withoutEdges
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .join('/')

  if (!collapsedSegments) {
    return DEFAULT_SOCIAL_SLUG
  }

  const slug = collapsedSegments.replace(/\s+/gu, '-').replace(/-{2,}/gu, '-')
  return slug || DEFAULT_SOCIAL_SLUG
}

export const resolveSiteUrl = (site?: SiteInput): URL => {
  if (site instanceof URL) {
    return site
  }

  if (typeof site === 'string') {
    return new URL(site)
  }

  if (site?.site instanceof URL) {
    return site.site
  }

  if (site?.url instanceof URL) {
    return new URL(site.url.origin)
  }

  return new URL(getSiteUrl())
}

export const getSocialImageLink = (path?: string | null, site?: SiteInput): string => {
  const slug = normalizeSocialSlug(path)

  const url = new URL('/api/social-card', resolveSiteUrl(site))
  url.searchParams.set('slug', slug)
  return url.toString()
}
