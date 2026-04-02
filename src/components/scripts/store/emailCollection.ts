/**
 * Email Collection State Management
 *
 * Tracks whether the visitor has already provided their email (via newsletter,
 * contact, or download forms). When populated the download gate can be skipped.
 */
import { persistentAtom } from '@nanostores/persistent'
import { StoreController } from '@nanostores/lit'
import type { ReactiveControllerHost } from 'lit'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addScriptBreadcrumb } from '@components/scripts/errors/sentry'

// ============================================================================
// TYPES
// ============================================================================

export type EmailSource = 'newsletter_form' | 'contact_form' | 'download_form'

export interface EmailCollectionState {
  hasProvidedEmail: boolean
  email: string
  source: EmailSource | ''
  collectedAt: string
}

// ============================================================================
// STORE
// ============================================================================

const defaultEmailCollectionState: EmailCollectionState = {
  hasProvidedEmail: false,
  email: '',
  source: '',
  collectedAt: '',
}

export const $emailCollection = persistentAtom<EmailCollectionState>(
  'emailCollection',
  defaultEmailCollectionState,
  {
    encode: JSON.stringify,
    decode: (value: string): EmailCollectionState => {
      try {
        const parsed = JSON.parse(value) as Partial<EmailCollectionState>
        return {
          ...defaultEmailCollectionState,
          ...parsed,
        }
      } catch {
        return defaultEmailCollectionState
      }
    },
  }
)

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Records that the visitor provided their email. Persists to localStorage so
 * subsequent download pages can skip the gate.
 */
export function markEmailCollected(email: string, source: EmailSource): void {
  addScriptBreadcrumb({ scriptName: 'emailCollection', operation: 'markEmailCollected' })
  try {
    $emailCollection.set({
      hasProvidedEmail: true,
      email,
      source,
      collectedAt: new Date().toISOString(),
    })
  } catch (error) {
    handleScriptError(error, { scriptName: 'emailCollection', operation: 'markEmailCollected' })
  }
}

/** Clears the stored email (e.g. after a GDPR deletion request). */
export function clearCollectedEmail(): void {
  addScriptBreadcrumb({ scriptName: 'emailCollection', operation: 'clearCollectedEmail' })
  try {
    $emailCollection.set(defaultEmailCollectionState)
  } catch (error) {
    handleScriptError(error, { scriptName: 'emailCollection', operation: 'clearCollectedEmail' })
  }
}

/** One-shot read of the current state. Prefer subscriptions in UI code. */
export function getEmailCollectionSnapshot(): EmailCollectionState {
  return $emailCollection.get()
}

/** Subscribe to changes — returns an unsubscribe function. */
export function subscribeToEmailCollection(
  callback: (_state: EmailCollectionState) => void
): () => void {
  return $emailCollection.subscribe(callback)
}

/**
 * Lit reactive controller that keeps a host element in sync with the email
 * collection store.
 */
export function createEmailCollectionController(
  host: ReactiveControllerHost
): StoreController<EmailCollectionState> {
  return new StoreController(host, $emailCollection)
}

/** Test-only reset. Restores the store to its default state. */
export function __resetEmailCollectionForTests(): void {
  $emailCollection.set(defaultEmailCollectionState)
}
