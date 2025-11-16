import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { KV_REST_API_URL, KV_REST_API_TOKEN } from 'astro:env/server'
import { isDev, isTest } from '@components/scripts/utils'

const redis = new Redis({
  url: KV_REST_API_URL,
  token: KV_REST_API_TOKEN,
})

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, number[]>()

export const rateLimiters = {
  consent: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
  }),
  consentRead: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
  }),
  export: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
  }),
  delete: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    analytics: true,
  }),
  contact: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
  }),
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; reset?: number }> {
  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    reset: result.reset,
  }
}

/**
 * Check if the IP address has exceeded the contact form rate limit
 * Disabled in development and CI environments
 */
export function checkContactRateLimit(ip: string): boolean {
  // Skip rate limiting in dev/test environments
  if (isDev() || isTest()) {
    return true
  }

  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 5 // Lower limit for contact form
  const key = `contact_rate_limit_${ip}`
  const requests = rateLimitStore.get(key) || []

  const validRequests = requests.filter((timestamp) => now - timestamp < windowMs)

  if (validRequests.length >= maxRequests) {
    return false
  }

  validRequests.push(now)
  rateLimitStore.set(key, validRequests)
  return true
}
