/**
 * Consent banner state management
 *
 * Primary requirement: keep consent banner visibility stable across Astro View Transitions.
 * Screen readers may run the site in constrained WebViews, so storage-backed state must be best-effort.
 */
import { computed } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import { handleScriptError } from '@components/scripts/errors/handler'
import { disableTableOfContents, enableTableOfContents, hideTableOfContents } from './tableOfContents'

export interface ConsentBannerState {
  visible: boolean
}

const defaultConsentBannerState: ConsentBannerState = {
  visible: false,
}

export const $consentBanner = persistentAtom<ConsentBannerState>(
  'consentBanner',
  defaultConsentBannerState,
  {
    encode: JSON.stringify,
    decode: (value: string): ConsentBannerState => {
      try {
        const parsed = JSON.parse(value) as Partial<ConsentBannerState>
        return {
          ...defaultConsentBannerState,
          ...parsed,
        }
      } catch {
        return defaultConsentBannerState
      }
    },
  }
)

export const $isConsentBannerVisible = computed($consentBanner, (state) => state.visible)

function updateConsentBanner(operation: string, updater: (_current: ConsentBannerState) => ConsentBannerState): void {
  try {
    const current = $consentBanner.get()
    const next = updater(current)
    $consentBanner.set(next)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'consentBanner',
      operation,
    })
  }
}

export function getConsentBannerVisibility(): boolean {
  return $isConsentBannerVisible.get()
}

export function showConsentBanner(): void {
  updateConsentBanner('showConsentBanner', (current) => ({
    ...current,
    visible: true,
  }))

  // Keep the ToC from stealing focus while the banner is active.
  disableTableOfContents()
  hideTableOfContents()
}

export function hideConsentBanner(): void {
  updateConsentBanner('hideConsentBanner', (current) => ({
    ...current,
    visible: false,
  }))

  enableTableOfContents()
}

export function toggleConsentBanner(): void {
  const nextVisible = !$isConsentBannerVisible.get()
  if (nextVisible) {
    showConsentBanner()
  } else {
    hideConsentBanner()
  }
}

export function __resetConsentBannerForTests(): void {
  $consentBanner.set(defaultConsentBannerState)
}
