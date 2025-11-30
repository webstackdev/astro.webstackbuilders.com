/**
 * Mastodon Instances State Management
 */
import { persistentAtom } from '@nanostores/persistent'
import { $hasFunctionalConsent } from './consent'

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
 * Set current Mastodon instance
 */
export function setCurrentMastodonInstance(instance: string): void {
  $currentMastodonInstance.set(instance)
}

/**
 * Get current Mastodon instance
 */
export function getCurrentMastodonInstance(): string | undefined {
  return $currentMastodonInstance.get()
}

/**
 * Add Mastodon instance (max 5, FIFO)
 */
export function saveMastodonInstance(domain: string): void {
  if (!$hasFunctionalConsent.get()) return

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
 * Subscribe to Mastodon instances changes
 * Returns unsubscribe function
 */
export function subscribeMastodonInstances(
  callback: (_instances: Set<string>) => void
): () => void {
  return $mastodonInstances.subscribe(callback)
}

// ============================================================================
// SIDE EFFECTS
// ============================================================================

/**
 * Initialize side effect to clear Mastodon data when functional consent is revoked
 * Call this once during app initialization
 */
export function mastodonDataConsentRevokeListener(): void {
  $hasFunctionalConsent.subscribe((hasConsent) => {
    if (!hasConsent) {
      clearMastodonInstances()
      $currentMastodonInstance.set(undefined)
    }
  })
}
