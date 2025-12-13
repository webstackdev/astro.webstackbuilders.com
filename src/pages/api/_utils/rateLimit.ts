import { isDbError } from 'astro:db'
import { isDev, isTest } from '@pages/api/_environment/environmentApi'
import { withRateLimitWindow } from '@pages/api/_utils/rateLimitStore'

export type RateLimiter = {
  limit: (_identifier: string) => Promise<{ success: boolean; reset: number | undefined }>
}

export type RateLimiterKey = 'consent' | 'consentRead' | 'export' | 'delete' | 'contact'

export type RateLimiterMap = Record<RateLimiterKey, RateLimiter>

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, number[]>()

type RateLimiterConfig = {
  scope: RateLimiterKey
  limit: number
  windowMs: number
}

const limiterConfigs: Record<RateLimiterKey, RateLimiterConfig> = {
  consent: { scope: 'consent', limit: 10, windowMs: 60_000 },
  consentRead: { scope: 'consentRead', limit: 30, windowMs: 60_000 },
  export: { scope: 'export', limit: 5, windowMs: 60_000 },
  delete: { scope: 'delete', limit: 3, windowMs: 60_000 },
  contact: { scope: 'contact', limit: 5, windowMs: 15 * 60 * 1000 },
}

export const rateLimiters: RateLimiterMap = {
  consent: createLimiter(limiterConfigs.consent),
  consentRead: createLimiter(limiterConfigs.consentRead),
  export: createLimiter(limiterConfigs.export),
  delete: createLimiter(limiterConfigs.delete),
  contact: createLimiter(limiterConfigs.contact),
}

export async function checkRateLimit(
  limiter: RateLimiter,
  identifier: string,
): Promise<{ success: boolean; reset: number | undefined }> {
  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    reset: result.reset,
  }
}

/**
 * Check if the client fingerprint (hashed IP/UA) exceeded the contact form limit.
 * Disabled in development and CI environments. Callers should hash PII before
 * invoking this helper to keep rate-limiting compliant with GDPR requirements.
 */
export function checkContactRateLimit(ipFingerprint: string): boolean {
  // Skip rate limiting in dev/test environments
  if (isDev() || isTest()) {
    return true
  }

  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 5 // Lower limit for contact form
  const key = `contact_rate_limit_${ipFingerprint}`
  const requests = rateLimitStore.get(key) || []

  const validRequests = requests.filter((timestamp) => now - timestamp < windowMs)

  if (validRequests.length >= maxRequests) {
    return false
  }

  validRequests.push(now)
  rateLimitStore.set(key, validRequests)
  return true
}
function createLimiter(config: RateLimiterConfig): RateLimiter {
  return {
    limit: identifier => applyRateLimit(config, identifier),
  }
}

async function applyRateLimit(
  config: RateLimiterConfig,
  identifier: string,
): Promise<{ success: boolean; reset: number | undefined }> {
  if (isDev() || isTest()) {
    return {
      success: true,
      reset: Date.now() + config.windowMs,
    }
  }

  if (!identifier) {
    return { success: true, reset: Date.now() + config.windowMs }
  }

  try {
    return await withRateLimitWindow(config.scope, identifier, async context => {
      const now = Date.now()
      const currentWindow = context.window

      if (!currentWindow || currentWindow.windowExpiresAt <= now) {
        const reset = now + config.windowMs
        const nextWindow = await context.resetWindow({
          hits: 1,
          limit: config.limit,
          windowMs: config.windowMs,
          windowExpiresAt: reset,
        })
        return { success: true, reset: nextWindow.windowExpiresAt }
      }

      if (currentWindow.hits < config.limit) {
        const updatedWindow = await context.incrementHits()
        return { success: true, reset: updatedWindow.windowExpiresAt }
      }

      return {
        success: false,
        reset: currentWindow.windowExpiresAt,
      }
    })
  } catch (error) {
    if (isDbError(error)) {
      return {
        success: false,
        reset: Date.now() + config.windowMs,
      }
    }
    throw error
  }
}
