/**
 * Central State Management
 * Single source of truth for all client-side state
 */
import { atom, map, computed } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import { getCookie, setCookie } from './cookies'

// ============================================================================
// TYPES
// ============================================================================

export type ConsentCategory = 'necessary' | 'analytics' | 'advertising' | 'functional'
export type ConsentValue = boolean
export type ThemeId = 'default' | 'dark' | 'holiday'

export interface ConsentState {
  necessary: ConsentValue
  analytics: ConsentValue
  advertising: ConsentValue
  functional: ConsentValue
  timestamp?: string
}

export interface EmbedCacheEntry {
  data: unknown
  timestamp: number
  ttl: number
}

export interface EmbedCacheState {
  [key: string]: EmbedCacheEntry
}

// ============================================================================
// STORES (Single Source of Truth)
// ============================================================================

/**
 * Consent preferences
 * Source of truth: Cookies (necessary for GDPR compliance)
 * Store updates when cookies change
 */
export const $consent = map<ConsentState>({
  necessary: true,
  analytics: false,
  advertising: false,
  functional: false,
})

/**
 * Theme preference
 * Persisted to localStorage automatically via nanostores/persistent
 * Requires functional consent to persist
 */
export const $theme = persistentAtom<ThemeId>('theme', 'default', {
  encode: JSON.stringify,
  decode: (value: string) => {
    try {
      return JSON.parse(value)
    } catch {
      // Handle plain string values from legacy storage or manual setting
      // If it's a valid ThemeId, return it, otherwise return default
      const validThemes: ThemeId[] = ['default', 'dark', 'holiday']
      return validThemes.includes(value as ThemeId) ? (value as ThemeId) : 'default'
    }
  },
})

/**
 * Cookie consent modal visibility
 * Session-only state (not persisted)
 */
export const $cookieModalVisible = atom<boolean>(false)

/**
 * Mastodon instances
 * Persisted to localStorage automatically
 * Requires functional consent to persist
 */
export const $mastodonInstances = persistentAtom<Set<string>>('mastodonInstances', new Set(), {
  encode: (set: Set<string>) => JSON.stringify([...set]),
  decode: (value: string) => {
    try {
      return new Set(JSON.parse(value) as string[])
    } catch {
      // Handle invalid JSON - return empty set
      return new Set()
    }
  },
})

/**
 * Current Mastodon instance
 * Persisted to localStorage automatically
 * Requires functional consent to persist
 */
export const $currentMastodonInstance = persistentAtom<string | undefined>(
  'mastodonCurrentInstance',
  undefined
)

/**
 * Social embed cache
 * Session-only (not persisted to localStorage)
 * Requires functional consent to use
 */
export const $embedCache = map<EmbedCacheState>({})

// ============================================================================
// COMPUTED STORES (Derived State - like Redux selectors)
// ============================================================================

/**
 * Check if specific consent category is granted
 */
export const $hasAnalyticsConsent = computed($consent, consent => consent.analytics)
export const $hasFunctionalConsent = computed($consent, consent => consent.functional)
export const $hasAdvertisingConsent = computed($consent, consent => consent.advertising)

/**
 * Check if any non-necessary consent is granted
 */
export const $hasAnyConsent = computed($consent, consent => {
  return consent.analytics || consent.functional || consent.advertising
})

// ============================================================================
// ACTIONS (State Updaters)
// ============================================================================

/**
 * Initialize consent state from cookies on page load
 * Called once during app initialization
 */
export function initConsentFromCookies(): void {
  const consent: ConsentState = {
    necessary: true, // Always true
    analytics: getCookie('consent_analytics') === 'true',
    advertising: getCookie('consent_advertising') === 'true',
    functional: getCookie('consent_functional') === 'true',
  }

  $consent.set(consent)
}

/**
 * Update consent for specific category
 * Automatically updates both store AND cookie
 */
export function updateConsent(category: ConsentCategory, value: ConsentValue): void {
  // Update store
  $consent.setKey(category, value)

  // Update cookie
  const cookieName = `consent_${category}`
  setCookie(cookieName, value.toString(), { expires: 365, sameSite: 'strict' })

  // Add timestamp
  $consent.setKey('timestamp', new Date().toISOString())
}

/**
 * Grant all consent categories
 */
export function allowAllConsent(): void {
  const categories: ConsentCategory[] = ['necessary', 'analytics', 'advertising', 'functional']
  categories.forEach(category => updateConsent(category, true))
}

/**
 * Revoke all non-necessary consent
 */
export function revokeAllConsent(): void {
  updateConsent('analytics', false)
  updateConsent('advertising', false)
  updateConsent('functional', false)
}

/**
 * Update theme
 * Automatically persisted to localStorage by persistentAtom
 * Only persists if functional consent is granted
 */
export function setTheme(themeId: ThemeId): void {
  const hasFunctionalConsent = $consent.get().functional

  if (hasFunctionalConsent) {
    $theme.set(themeId)
  } else {
    // Session-only: update DOM but don't persist
    document.documentElement.setAttribute('data-theme', themeId)
  }
}

/**
 * Add Mastodon instance (max 5, FIFO)
 */
export function saveMastodonInstance(domain: string): void {
  const hasFunctionalConsent = $consent.get().functional
  if (!hasFunctionalConsent) return

  const instances = $mastodonInstances.get()
  const updated = new Set([domain, ...instances].slice(0, 5))
  $mastodonInstances.set(updated)
}

/**
 * Remove Mastodon instance
 */
export function removeMastodonInstance(domain: string): void {
  const instances = $mastodonInstances.get()
  instances.delete(domain)
  $mastodonInstances.set(new Set(instances))
}

/**
 * Clear all Mastodon instances
 */
export function clearMastodonInstances(): void {
  $mastodonInstances.set(new Set())
}

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

// ============================================================================
// SIDE EFFECTS (Automatic reactions to state changes)
// ============================================================================

/**
 * Setup side effects - call once during app initialization
 * This is like Redux middleware or RTK's createAsyncThunk
 */
export function initStateSideEffects(): void {
  // Side Effect 1: Clear localStorage when functional consent is revoked
  $hasFunctionalConsent.subscribe(hasConsent => {
    if (!hasConsent) {
      // Clear theme from localStorage
      localStorage.removeItem('theme')

      // Clear Mastodon instances from localStorage
      localStorage.removeItem('mastodonInstances')
      localStorage.removeItem('mastodonCurrentInstance')

      // Clear embed cache
      clearEmbedCache()
    }
  })

  // Side Effect 2: Reload consent-gated scripts when consent changes
  $hasAnalyticsConsent.subscribe(hasConsent => {
    if (hasConsent) {
      // Trigger loader to load analytics scripts
      window.dispatchEvent(
        new CustomEvent('consent-changed', {
          detail: { category: 'analytics', granted: true },
        })
      )
    } else {
      // Unload analytics scripts
      window.dispatchEvent(
        new CustomEvent('consent-changed', {
          detail: { category: 'analytics', granted: false },
        })
      )
    }
  })

  // Side Effect 3: Handle functional consent changes for scripts
  $hasFunctionalConsent.subscribe(hasConsent => {
    window.dispatchEvent(
      new CustomEvent('consent-changed', {
        detail: { category: 'functional', granted: hasConsent },
      })
    )
  })

  // Side Effect 4: Handle advertising consent changes for scripts
  $hasAdvertisingConsent.subscribe(hasConsent => {
    window.dispatchEvent(
      new CustomEvent('consent-changed', {
        detail: { category: 'advertising', granted: hasConsent },
      })
    )
  })

  // Side Effect 5: Update DOM and localStorage when theme changes
  $theme.subscribe(themeId => {
    // Update DOM attribute
    document.documentElement.setAttribute('data-theme', themeId)

    // Sync to localStorage for FOUC prevention (Head/index.astro reads this on page load)
    // NOTE: This is a side effect only - nanostore is the source of truth
    try {
      localStorage.setItem('theme', themeId)
    } catch (error) {
      console.warn('Failed to sync theme to localStorage:', error)
    }

    // Update meta theme-color
    const metaElement = document.querySelector('meta[name="theme-color"]')
    if (metaElement && window.metaColors) {
      metaElement.setAttribute('content', window.metaColors[themeId] || '')
    }
  })

  // Side Effect 6: Show/hide cookie modal
  $cookieModalVisible.subscribe(visible => {
    const modal = document.getElementById('cookie-modal-id')
    if (modal) {
      modal.style.display = visible ? 'flex' : 'none'
    }
  })
}
