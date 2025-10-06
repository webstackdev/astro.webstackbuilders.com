/**
 * SEO and metadata utility functions
 */

/**
 * Build page title with site title
 * Usage: buildPageTitle(title, siteName)
 */
export function buildPageTitle(pageTitle?: string, siteTitle?: string): string {
  if (!pageTitle) return siteTitle || 'Webstack Builders'
  if (!siteTitle) return pageTitle
  return `${pageTitle} | ${siteTitle}`
}

/**
 * Get canonical URL for a page
 * Usage: getCanonicalURL(page, baseUrl)
 */
export function getCanonicalURL(page: { url: string }, baseUrl: string): string {
  const cleanUrl = page.url.replace(/\/+$/, '') || '/'
  return `${baseUrl.replace(/\/+$/, '')}${cleanUrl}`
}

/**
 * Get social share image URL
 * Usage: getSocialImage(fileSlug, baseUrl)
 */
export function getSocialImage(slug?: string, baseUrl?: string): string {
  const baseURL = baseUrl || 'https://webstackbuilders.com'
  const slugWithDefault = slug || 'home'
  return `${baseURL}/social-images/${slugWithDefault}.png`
}

/**
 * Generate page description for meta tags
 * Usage: getPageDescription(description, autoDescription, siteDescription)
 */
export function getPageDescription(
  description?: string,
  autoDescription?: string,
  siteDescription?: string
): string {
  return description || autoDescription || siteDescription || 'Webstack Builders - Professional Web Development Services'
}