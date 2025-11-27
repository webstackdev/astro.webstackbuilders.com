import { BuildError } from '@lib/errors/BuildError'

export interface SocialMetadataOptions {
  title?: string
  description?: string
  slug?: string
  image?: string
  url?: string
  baseUrl: string
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
 * Get social share image URL using dynamic generation
 * Usage: getSocialImage(baseUrl, title, description, slug)
 */
const normalizeBaseUrl = (value?: string): string => {
  if (!value || value.trim() === '') {
    throw new BuildError('Base URL is required to generate social metadata.')
  }

  const base = value.trim()
  return base.replace(/\/+$/, '')
}

export function getSocialImage(
  baseUrl: string,
  title?: string,
  description?: string,
  slug?: string
): string {
  const baseURL = normalizeBaseUrl(baseUrl)
  const encodedTitle = encodeURIComponent(title || 'Webstack Builders')
  const encodedDescription = encodeURIComponent(
    description || 'Professional Web Development Services'
  )
  const encodedSlug = encodeURIComponent(slug || 'home')

  // For development, you can use a service like htmlcsstoimage.com or similar
  // For production, integrate with services like Puppeteer, Playwright, or @vercel/og
  return `${baseURL}/api/social-card?title=${encodedTitle}&description=${encodedDescription}&slug=${encodedSlug}&format=html`
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
    baseUrl,
  } = options

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const socialImage = image || getSocialImage(normalizedBaseUrl, title, description, slug)
  const socialUrl = url || `${normalizedBaseUrl}/${slug}`
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
    twitterImageAlt: imageAlt,
  }
}
