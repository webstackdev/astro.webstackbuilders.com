/**
 * WebMentions utilities for fetching and processing webmentions from webmention.io
 *
 * @see https://webmention.io/
 * @see https://github.com/aaronpk/webmention.io
 */
import {  WEBMENTION_IO_TOKEN } from 'astro:env/client'

export interface WebmentionAuthor {
  url?: string
  name?: string
  photo?: string
}

export interface WebmentionContent {
  html?: string
  text?: string
  value?: string
}

export interface Webmention {
  'wm-id': string
  'wm-target': string
  'wm-property': string
  'wm-source'?: string
  published: string
  author?: WebmentionAuthor
  content?: WebmentionContent
  url?: string
}

interface WebmentionResponse {
  type: string
  name: string
  children: Webmention[]
}

/**
 * Sanitize HTML content
 * In production, consider using DOMPurify or sanitize-html
 */
const sanitizeHTML = (html: string): string => {
  // Basic sanitization - remove script tags
  // For production, install and use sanitize-html or DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
}

/**
 * Check if a webmention is from your own domain
 */
export const isOwnWebmention = (
  webmention: Webmention,
  ownUrls: string[] = ['https://webstackbuilders.com']
): boolean => {
  const authorUrl = webmention.author?.url
  return Boolean(authorUrl && ownUrls.some(url => authorUrl.startsWith(url)))
}

/**
 * Clean and process webmention content
 */
const cleanWebmention = (entry: Webmention): Webmention => {
  if (!entry.content) return entry

  const { html, text } = entry.content

  if (html) {
    // Really long html mentions, usually newsletters or compilations
    entry.content.value =
      html.length > 2000
        ? `mentioned this in <a href="${entry['wm-source']}">${entry['wm-source']}</a>`
        : sanitizeHTML(html)
  } else if (text) {
    entry.content.value = sanitizeHTML(text)
  }

  return entry
}

/**
 * Fetch webmentions from webmention.io API
 *
 * @param url - The target URL to fetch mentions for
 * @param token - Optional webmention.io API token (from env var)
 * @returns Array of processed webmentions
 */
export const fetchWebmentions = async (url: string): Promise<Webmention[]> => {
  try {
    // Fetch from webmention.io API
    const apiUrl = new URL('https://webmention.io/api/mentions.jf2')
    apiUrl.searchParams.set('target', url)
    apiUrl.searchParams.set('token', WEBMENTION_IO_TOKEN)
    apiUrl.searchParams.set('per-page', '1000')

    const response = await fetch(apiUrl.toString(), {
      // Cache for 5 minutes during build
      headers: {
        'Cache-Control': 'max-age=300'
      }
    })

    if (!response.ok) {
      console.error(`Failed to fetch webmentions: ${response.status} ${response.statusText}`)
      return []
    }

    const data: WebmentionResponse = await response.json()

    if (!data.children || !Array.isArray(data.children)) {
      console.warn('No webmentions found or invalid response format')
      return []
    }

    // Filter and process webmentions
    const allowedTypes = ['mention-of', 'in-reply-to', 'like-of', 'repost-of']

    const checkRequiredFields = (entry: Webmention) => {
      const { author, published, content } = entry
      // Likes and reposts don't need content
      if (['like-of', 'repost-of'].includes(entry['wm-property'])) {
        return !!author && !!author.name && !!published
      }
      return !!author && !!author.name && !!published && !!content
    }

    const orderByDate = (a: Webmention, b: Webmention) =>
      new Date(a.published).getTime() - new Date(b.published).getTime()

    return data.children
      .filter((entry) => allowedTypes.includes(entry['wm-property']))
      .filter(checkRequiredFields)
      .sort(orderByDate)
      .map(cleanWebmention)

  } catch (error) {
    console.error('Error fetching webmentions:', error)
    return []
  }
}

/**
 * Filter webmentions by URL
 * Useful if you're fetching mentions for multiple URLs at once
 */
export const webmentionsByUrl = (
  webmentions: Webmention[],
  url: string
): Webmention[] => {
  return webmentions.filter((entry) => entry['wm-target'] === url)
}

/**
 * Count webmentions by type
 */
export const webmentionCountByType = (
  webmentions: Webmention[],
  url: string,
  ...types: string[]
): number => {
  return webmentions.filter(
    (entry) => entry['wm-target'] === url && types.includes(entry['wm-property'])
  ).length
}
