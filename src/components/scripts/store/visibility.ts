/**
 * UI Visibility State Management
 * Tracks visibility state for modals, overlays, and other UI elements
 */
import { computed } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import { handleScriptError } from '@components/scripts/errors'

// ============================================================================
// TYPES
// ============================================================================

export interface VisibilityState {
  consentBannerVisible: boolean
}

// ============================================================================
// STORES
// ============================================================================

/**
 * UI visibility state
 * Persisted to localStorage to survive page transitions and reloads
 * This keeps modals/overlays in their current state during navigation for better UX
 */
export const $visibility = persistentAtom<VisibilityState>(
  'visibility',
  {
    consentBannerVisible: false,
  },
  {
    encode: JSON.stringify,
    decode: (value: string): VisibilityState => {
      try {
        return JSON.parse(value)
      } catch {
        return {
          consentBannerVisible: false,
        }
      }
    },
  }
)

// ============================================================================
// COMPUTED STORES
// ============================================================================

/**
 * Check if consent banner is visible
 */
export const $isConsentBannerVisible = computed($visibility, (state) => state.consentBannerVisible)

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Show the consent banner
 */
export function showConsentBanner(): void {
  try {
    const current = $visibility.get()
    $visibility.set({
      ...current,
      consentBannerVisible: true,
    })
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'visibility',
      operation: 'showConsentBanner',
    })
  }
}

/**
 * Hide the consent banner
 */
export function hideConsentBanner(): void {
  try {
    const current = $visibility.get()
    $visibility.set({
      ...current,
      consentBannerVisible: false,
    })
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'visibility',
      operation: 'hideConsentBanner',
    })
  }
}

/**
 * Toggle the consent banner visibility
 */
export function toggleConsentBanner(): void {
  try {
    const current = $visibility.get()
    $visibility.set({
      ...current,
      consentBannerVisible: !current.consentBannerVisible,
    })
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'visibility',
      operation: 'toggleConsentBanner',
    })
  }
}
