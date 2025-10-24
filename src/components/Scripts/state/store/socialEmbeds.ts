/**
 * Social Embeds Cache State Management
 */
import { map } from 'nanostores'
import type { EmbedCacheState } from './@types'
import { $consent } from './cookieConsent'

// ============================================================================
// STORES
// ============================================================================

/**
 * Social embed cache
 * Session-only (not persisted to localStorage)
 * Requires functional consent to use
 */
export const $embedCache = map<EmbedCacheState>({})

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Add embed to cache
 */
export function cacheEmbed(key: string, data: unknown, ttl: number): void {
  const hasFunctionalConsent = $consent.get().functional
  if (!hasFunctionalConsent) return

  $embedCache.setKey(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

/**
 * Get embed from cache (returns null if expired or missing)
 */
export function getCachedEmbed(key: string): unknown | null {
  const hasFunctionalConsent = $consent.get().functional
  if (!hasFunctionalConsent) return null

  const entry = $embedCache.get()[key]
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > entry.ttl) {
    // Expired - remove from cache
    const cache = { ...$embedCache.get() }
    delete cache[key]
    $embedCache.set(cache)
    return null
  }

  return entry.data
}

/**
 * Clear embed cache
 */
export function clearEmbedCache(): void {
  $embedCache.set({})
}
