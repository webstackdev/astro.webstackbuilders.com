/**
 * Search UI state management
 *
 * Stores header search open/closed state in localStorage so it persists across
 * Astro View Transitions and page reloads.
 */

import { persistentAtom } from '@nanostores/persistent'
import { handleScriptError } from '@components/scripts/errors/handler'

const headerSearchExpandedStorageKey = 'headerSearchExpanded'

/**
 * Header search expanded/collapsed state.
 * Persisted to localStorage automatically via nanostores/persistent.
 */
export const $headerSearchExpanded = persistentAtom<boolean>(
  headerSearchExpandedStorageKey,
  false,
  {
    encode: value => JSON.stringify(value),
    decode: (value: string) => {
      try {
        return JSON.parse(value) === true
      } catch {
        return false
      }
    },
  }
)

// ============================================================================
// ACTIONS
// ============================================================================

export function getHeaderSearchExpanded(): boolean {
  return $headerSearchExpanded.get()
}

export function setHeaderSearchExpanded(isExpanded: boolean): void {
  try {
    $headerSearchExpanded.set(isExpanded)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'search',
      operation: 'setHeaderSearchExpanded',
    })
  }
}

export function openHeaderSearch(): void {
  setHeaderSearchExpanded(true)
}

export function closeHeaderSearch(): void {
  setHeaderSearchExpanded(false)
}

export function toggleHeaderSearch(): void {
  setHeaderSearchExpanded(!getHeaderSearchExpanded())
}

export function subscribeHeaderSearchExpanded(listener: (_isExpanded: boolean) => void): () => void {
  return $headerSearchExpanded.subscribe(listener)
}

// ============================================================================
// SIDE EFFECTS
// ============================================================================

let isHeaderSearchSideEffectsInitialized = false

const setHeaderSearchOpenAttribute = (isOpen: boolean): void => {
  if (typeof document === 'undefined') {
    return
  }

  const header = document.getElementById('header')
  if (!header) {
    return
  }

  header.setAttribute('data-header-search-open', isOpen ? 'true' : 'false')
}

/**
 * Initialize DOM side effects for the header search state.
 *
 * This updates the `#header` element with a `data-header-search-open` attribute,
 * enabling responsive CSS to hide/show header UI elements without having
 * components directly subscribe to stores.
 */
export function initHeaderSearchSideEffects(): void {
  if (isHeaderSearchSideEffectsInitialized) {
    return
  }

  isHeaderSearchSideEffectsInitialized = true

  try {
    setHeaderSearchOpenAttribute(getHeaderSearchExpanded())

    $headerSearchExpanded.listen(isExpanded => {
      setHeaderSearchOpenAttribute(isExpanded)
    })
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'search',
      operation: 'initHeaderSearchSideEffects',
    })
  }
}

export function __resetHeaderSearchForTests(): void {
  try {
    $headerSearchExpanded.set(false)
    isHeaderSearchSideEffectsInitialized = false

    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        window.localStorage.removeItem(headerSearchExpandedStorageKey)
      } catch {
        // Ignore storage failures
      }
    }

    if (typeof document !== 'undefined') {
      document.getElementById('header')?.removeAttribute('data-header-search-open')
    }
  } catch {
    // Ignore reset failures
  }
}
