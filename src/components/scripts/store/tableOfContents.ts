/**
 * UI Visibility State Management
 * Tracks visibility state for modals, overlays, and other UI elements
 */
import { computed } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import { handleScriptError } from '@components/scripts/errors/handler'

// ============================================================================
// TYPES
// ============================================================================

export interface VisibilityState {
  tableOfContentsVisible: boolean
  tableOfContentsEnabled: boolean
}

const defaultVisibilityState: VisibilityState = {
  tableOfContentsVisible: false,
  tableOfContentsEnabled: true,
}

// ============================================================================
// STORES
// ============================================================================

/**
 * UI visibility state
 * Persisted to localStorage to survive page transitions and reloads
 * This keeps modals/overlays in their current state during navigation for better UX
 */
export const $visibility = persistentAtom<VisibilityState>('visibility', defaultVisibilityState, {
  encode: JSON.stringify,
  decode: (value: string): VisibilityState => {
    try {
      const parsed = JSON.parse(value) as Partial<VisibilityState>
      return {
        ...defaultVisibilityState,
        ...parsed,
      }
    } catch {
      return defaultVisibilityState
    }
  },
})

// ============================================================================
// COMPUTED STORES
// ============================================================================

export const $isTableOfContentsVisible = computed($visibility, (state) => state.tableOfContentsVisible)

export const $isTableOfContentsEnabled = computed($visibility, (state) => state.tableOfContentsEnabled)

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Show the consent banner
 */
function updateVisibilityState(operation: string, updater: (_current: VisibilityState) => VisibilityState): void {
  try {
    const current = $visibility.get()
    const next = updater(current)
    $visibility.set(next)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'visibility',
      operation,
    })
  }
}

export function showTableOfContents(): void {
  updateVisibilityState('showTableOfContents', (current) => {
    if (!current.tableOfContentsEnabled) {
      return current
    }

    return {
      ...current,
      tableOfContentsVisible: true,
    }
  })
}

export function hideTableOfContents(): void {
  updateVisibilityState('hideTableOfContents', (current) => ({
    ...current,
    tableOfContentsVisible: false,
  }))
}

export function toggleTableOfContents(): void {
  updateVisibilityState('toggleTableOfContents', (current) => {
    if (!current.tableOfContentsEnabled) {
      return current
    }

    return {
      ...current,
      tableOfContentsVisible: !current.tableOfContentsVisible,
    }
  })
}

export function disableTableOfContents(): void {
  updateVisibilityState('disableTableOfContents', (current) => ({
    ...current,
    tableOfContentsEnabled: false,
    tableOfContentsVisible: false,
  }))
}

export function enableTableOfContents(): void {
  updateVisibilityState('enableTableOfContents', (current) => ({
    ...current,
    tableOfContentsEnabled: true,
  }))
}

export type VisibilityListener = (_state: VisibilityState) => void

export function onVisibilityChange(listener: VisibilityListener): () => void {
  return $visibility.subscribe(listener)
}
