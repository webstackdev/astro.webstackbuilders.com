/**
 * Social Embeds Cache State Management
 *
 * Classified as 'necessary' under GDPR:
 * - Stores only public oEmbed API responses (tweets, YouTube videos, etc.)
 * - No user authentication tokens or session data
 * - No browsing history or behavioral tracking
 * - Performance optimization that reduces external API calls
 * - Contains no information about which user viewed which embed
 * - GDPR Recital 30: Technical storage necessary for technical delivery
 */
import { persistentAtom } from '@nanostores/persistent'
import { $hasFunctionalConsent } from './consent'

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
 * Classified as 'necessary' - no consent required
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
 * Classified as 'necessary' - always caches, no consent check required
 */
export function cacheEmbed(key: string, data: unknown, ttl: number): void {
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
 * Classified as 'necessary' - always retrieves, no consent check required
 */
export function getCachedEmbed(key: string): unknown | null {
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

// ============================================================================
// SIDE EFFECTS
// ============================================================================

/**
 * Initialize side effect to clear Mastodon data when functional consent is revoked
 * Call this once during app initialization
 */
export function socialEmbedDataConsentRevokeListener(): void {
  $hasFunctionalConsent.subscribe((hasConsent) => {
    if (!hasConsent) {
      clearEmbedCache()
    }
  })
}
