/**
 * Mastodon Instances State Management
 */
import { persistentAtom } from '@nanostores/persistent'
import { $consent } from './cookieConsent'

// ============================================================================
// STORES
// ============================================================================

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

// ============================================================================
// ACTIONS
// ============================================================================

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
