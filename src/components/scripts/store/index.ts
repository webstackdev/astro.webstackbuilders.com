/**
 * Central State Management - Barrel Export
 * Single source of truth for all client-side state
 */
import { updateConsent } from './consent'
import { cacheEmbed } from './socialEmbeds'
import { saveMastodonInstance } from './mastodonInstances'
import { setOverlayPauseState } from './animationLifecycle'

// Re-export types
export type {

} from './@types'

// Re-export animation lifecycle store
export {
  $animationLifecycle,
  $animationPreferences,
  __resetAnimationLifecycleForTests,
  clearAnimationPreference,
  createAnimationController,
  getAnimationPreference,
  initAnimationLifecycle,
  setAnimationPreference,
  setOverlayPauseState,
  type AnimationControllerConfig,
  type AnimationControllerHandle,
  type AnimationId,
  type AnimationPlayState,
} from './animationLifecycle'

// Re-export cookie consent
export {
  type ConsentCategory,
  type ConsentCategories,
  type ConsentState,
  type ConsentValue,
  $consent, // only allowed to use in tests
  $hasMarketingConsent,
  $hasAnalyticsConsent,
  $hasAnyConsent,
  $hasFunctionalConsent,
  allowAllConsent,
  allowAllConsentCookies,
  getConsentSnapshot,
  subscribeToConsentState,
  ensureConsentCookiesInitialized,
  getConsentCookie,
  initConsentFromCookies,
  initConsentCookies,
  initConsentSideEffects,
  removeConsentCookies,
  revokeAllConsent,
  setConsentCookie,
  updateConsent,
  createConsentController,
  createAnalyticsConsentController,
  createFunctionalConsentController,
  createMarketingConsentController,
  createAnyConsentController,
  getFunctionalConsentPreference,
  subscribeToFunctionalConsent,
} from './consent'

// Re-export visibility
export {
  type VisibilityState,
  hideConsentBanner,
  showConsentBanner,
  toggleConsentBanner,
  isConsentBannerVisible,
} from './visibility'

// Re-export themes
export {
  closeThemePicker,
  createThemeController,
  createThemePickerOpenController,
  openThemePicker,
  setTheme,
  themeKeyChangeSideEffectsListener,
  toggleThemePicker,
  type ThemeId,
} from './themes'

// Re-export Mastodon instances
export {
  clearMastodonInstances,
  mastodonDataConsentRevokeListener,
  removeMastodonInstance,
  saveMastodonInstance,
} from './mastodonInstances'

// Re-export social embeds
export {
  cacheEmbed,
  clearEmbedCache,
  getCachedEmbed,
  getEmbedCacheState,
  setEmbedCacheState,
  socialEmbedDataConsentRevokeListener,
  type EmbedCacheEntry,
  type EmbedCacheState,
} from './socialEmbeds'

/**
 * Expose a limited set of store actions during Playwright runs so E2E tests
 * can seed state without relying on private internals or DOM-only flows.
 */
export function exposeStoreActionsForTesting(): void {
  if (typeof window === 'undefined' || window.isPlaywrightControlled !== true) {
    return
  }

  Object.assign(window, {
    updateConsent,
    cacheEmbed,
    saveMastodonInstance,
    setOverlayPauseState,
  })
}
