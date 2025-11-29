/**
 * WebMentions utilities for fetching and processing webmentions from webmention.io
 *
 * @see https://webmention.io/
 * @see https://github.com/aaronpk/webmention.io
 */
import { WEBMENTION_IO_TOKEN } from 'astro:env/server'
import type { Webmention, WebmentionResponse } from '@components/WebMentions/@types'

const allowedTypes = new Set(['mention-of', 'in-reply-to', 'like-of', 'repost-of'])
const PLACEHOLDER_TOKENS = new Set(['', 'updateme', 'your_api_token_here'])
const SUCCESS_CACHE_TTL_MS = 5 * 60 * 1000
const FAILURE_RETRY_COOLDOWN_MS = import.meta.env.DEV ? 60 * 1000 : 5 * 60 * 1000
const LOG_THROTTLE_WINDOW_MS = 60 * 1000
const FETCH_TIMEOUT_MS = 10_000

type CacheEntry = {
  expiresAt: number
  value: Webmention[]
}

const mentionCache = new Map<string, CacheEntry>()
const failureCooldowns = new Map<string, number>()
const pendingRequests = new Map<string, Promise<Webmention[]>>()
const logTimestamps = new Map<string, number>()
let missingTokenWarningShown = false

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

const cacheMentions = (url: string, value: Webmention[], ttlMs: number): void => {
  mentionCache.set(url, {
    expiresAt: Date.now() + ttlMs,
    value,
  })
}

const readCache = (url: string): Webmention[] | null => {
  const cached = mentionCache.get(url)
  if (!cached) {
    return null
  }

  if (cached.expiresAt > Date.now()) {
    return cached.value
  }

  mentionCache.delete(url)
  return null
}

const isTokenMissing = (): boolean => {
  const token = WEBMENTION_IO_TOKEN?.trim()
  return !token || PLACEHOLDER_TOKENS.has(token)
}

const logWithThrottle = (
  level: 'warn' | 'error',
  key: string,
  message: string,
  error?: unknown,
): void => {
  const lastLog = logTimestamps.get(key) ?? 0
  if (Date.now() - lastLog < LOG_THROTTLE_WINDOW_MS) {
    return
  }

  logTimestamps.set(key, Date.now())

  if (error instanceof Error) {
    console[level](message, error)
    return
  }

  if (typeof error !== 'undefined') {
    console[level](message, error)
    return
  }

  console[level](message)
}

const createTimeoutSignal = (): AbortSignal | undefined => {
  const AbortSignalWithTimeout = AbortSignal as typeof AbortSignal & {
    timeout?: (ms: number) => AbortSignal
  }

  if (typeof AbortSignalWithTimeout?.timeout === 'function') {
    return AbortSignalWithTimeout.timeout(FETCH_TIMEOUT_MS)
  }

  return undefined
}

const processResponse = (data: WebmentionResponse): Webmention[] => {
  if (!Array.isArray(data.children)) {
    throw new Error('Invalid webmention response payload')
  }

  const checkRequiredFields = (entry: Webmention) => {
    const { author, published, content } = entry
    if (['like-of', 'repost-of'].includes(entry['wm-property'])) {
      return Boolean(author && author.name && published)
    }
    return Boolean(author && author.name && published && content)
  }

  const orderByDate = (a: Webmention, b: Webmention) =>
    new Date(a.published).getTime() - new Date(b.published).getTime()

  return data.children
    .filter((entry) => allowedTypes.has(entry['wm-property']))
    .filter(checkRequiredFields)
    .sort(orderByDate)
    .map(cleanWebmention)
}

const requestWebmentions = async (url: string): Promise<Webmention[]> => {
  const apiUrl = new URL('https://webmention.io/api/mentions.jf2')
  apiUrl.searchParams.set('target', url)
  apiUrl.searchParams.set('token', WEBMENTION_IO_TOKEN)
  apiUrl.searchParams.set('per-page', '1000')

  const requestInit: RequestInit = {
    headers: {
      'Cache-Control': 'max-age=300',
    },
  }

  const signal = createTimeoutSignal()
  if (signal) {
    requestInit.signal = signal
  }

  const response = await fetch(apiUrl.toString(), requestInit)

  if (!response.ok) {
    throw new Error(`Failed to fetch webmentions: ${response.status} ${response.statusText}`)
  }

  const data: WebmentionResponse = await response.json()
  return processResponse(data)
}

const shouldSkipBecauseOfCooldown = (url: string): boolean => {
  const retryAt = failureCooldowns.get(url)
  if (!retryAt) {
    return false
  }

  if (retryAt <= Date.now()) {
    failureCooldowns.delete(url)
    return false
  }

  logWithThrottle(
    'warn',
    `webmentions-cooldown-${url}`,
    `[WebMentions] Skipping fetch for ${url} after a recent failure. Will retry soon.`,
  )

  return true
}

/**
 * Fetch webmentions from webmention.io API with caching and failure throttling
 *
 * @param targetUrl - The target URL to fetch mentions for
 * @returns Array of processed webmentions
 */
export const fetchWebmentions = async (targetUrl: string): Promise<Webmention[]> => {
  const normalizedUrl = targetUrl?.trim()
  if (!normalizedUrl) {
    return []
  }

  if (isTokenMissing()) {
    if (!missingTokenWarningShown) {
      console.warn('[WebMentions] WEBMENTION_IO_TOKEN is not configured. Skipping fetch calls.')
      missingTokenWarningShown = true
    }
    return []
  }

  const cached = readCache(normalizedUrl)
  if (cached) {
    return cached
  }

  if (shouldSkipBecauseOfCooldown(normalizedUrl)) {
    return mentionCache.get(normalizedUrl)?.value ?? []
  }

  const existingRequest = pendingRequests.get(normalizedUrl)
  if (existingRequest) {
    return existingRequest
  }

  const requestPromise = requestWebmentions(normalizedUrl)
    .then((mentions) => {
      cacheMentions(normalizedUrl, mentions, SUCCESS_CACHE_TTL_MS)
      failureCooldowns.delete(normalizedUrl)
      return mentions
    })
    .catch((error) => {
      failureCooldowns.set(normalizedUrl, Date.now() + FAILURE_RETRY_COOLDOWN_MS)
      logWithThrottle(
        'error',
        `webmentions-error-${normalizedUrl}`,
        `[WebMentions] Failed to fetch mentions for ${normalizedUrl}. Will retry in ${Math.round(FAILURE_RETRY_COOLDOWN_MS / 1000)}s.`,
        error,
      )

      if (!mentionCache.has(normalizedUrl)) {
        cacheMentions(normalizedUrl, [], FAILURE_RETRY_COOLDOWN_MS)
      }

      return mentionCache.get(normalizedUrl)?.value ?? []
    })
    .finally(() => {
      pendingRequests.delete(normalizedUrl)
    })

  pendingRequests.set(normalizedUrl, requestPromise)
  return requestPromise
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
