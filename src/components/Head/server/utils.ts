import { getSiteUrl } from '@lib/config/siteUrlServer'

const DEFAULT_SOCIAL_SLUG = 'home'

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

export const getSocialImageLink = (path?: string | null): string => {
  const slug = normalizeSocialSlug(path)

  const url = new URL('/api/social-card', getSiteUrl())
  url.searchParams.set('slug', slug)
  return url.toString()
}
