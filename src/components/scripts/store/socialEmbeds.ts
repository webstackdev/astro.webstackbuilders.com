/**
 * Social Embeds Cache State Management
 */
import { persistentAtom } from '@nanostores/persistent'
import { $consent } from './consent'

// ============================================================================
// TYPES
// ============================================================================

export interface EmbedCacheEntry {
  data: unknown
  timestamp: number
  ttl: number
}

export interface EmbedCacheState {
  [key: string]: EmbedCacheEntry
}

// ============================================================================
// STORES
// ============================================================================

/**
 * Social embed cache
 * Persisted to localStorage automatically via nanostores/persistent
 * Requires functional consent to use
 */
export const $embedCache = persistentAtom<EmbedCacheState>('socialEmbedCache', {}, {
  encode: JSON.stringify,
  decode: (value: string): EmbedCacheState => {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  },
})

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Add embed to cache
 */
export function cacheEmbed(key: string, data: unknown, ttl: number): void {
  const hasFunctionalConsent = $consent.get().functional
  if (!hasFunctionalConsent) return

  const currentCache = $embedCache.get()
  $embedCache.set({
    ...currentCache,
    [key]: {
      data,
      timestamp: Date.now(),
      ttl,
    },
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
