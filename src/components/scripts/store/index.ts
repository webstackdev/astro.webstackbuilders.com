/**
 * Central State Management - Barrel Export
 * Single source of truth for all client-side state
 */

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
  addViewTransitionThemeInitListener,
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
