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
 * Get social share image URL using dynamic generation
 * Usage: getSocialImage(title, description, slug, baseUrl)
 */
export function getSocialImage(
  title?: string,
  description?: string,
  slug?: string,
  baseUrl?: string
): string {
  const baseURL = baseUrl || 'https://webstackbuilders.com'
  const encodedTitle = encodeURIComponent(title || 'Webstack Builders')
  const encodedDescription = encodeURIComponent(description || 'Professional Web Development Services')
  const encodedSlug = encodeURIComponent(slug || 'home')

  // For development, you can use a service like htmlcsstoimage.com or similar
  // For production, integrate with services like Puppeteer, Playwright, or @vercel/og
  return `${baseURL}/api/social-card?title=${encodedTitle}&description=${encodedDescription}&slug=${encodedSlug}&format=html`
}

export interface SocialMetadataOptions {
  title?: string
  description?: string
  slug?: string
  image?: string
  url?: string
  baseUrl?: string
}

export interface SocialMetadata {
  ogTitle: string
  ogDescription: string
  ogImage: string
  ogImageAlt: string
  ogUrl: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
  twitterImageAlt: string
}

/**
 * Get social share metadata for Open Graph tags
 * Usage: getSocialMetadata({ title, description, slug, url })
 */
export function getSocialMetadata(options: SocialMetadataOptions): SocialMetadata {
  const {
    title = 'Webstack Builders',
    description = 'Professional Web Development Services',
    slug = 'home',
    image,
    url,
    baseUrl = 'https://webstackbuilders.com'
  } = options

  const socialImage = image || getSocialImage(slug, baseUrl)
  const socialUrl = url || `${baseUrl}/${slug}`
  const imageAlt = `Social card for ${title}`

  return {
    ogTitle: title,
    ogDescription: description,
    ogImage: socialImage,
    ogImageAlt: imageAlt,
    ogUrl: socialUrl,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: socialImage,
    twitterImageAlt: imageAlt
  }
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