/**
 * Central State Management - Barrel Export
 * Single source of truth for all client-side state
 */

// Re-export types
export type {

} from './@types'

// Re-export cookie consent
export {
  type ConsentCategory,
  type ConsentCategories,
  type ConsentState,
  type ConsentValue,
  $consent,
  $hasMarketingConsent,
  $hasAnalyticsConsent,
  $hasAnyConsent,
  $hasFunctionalConsent,
  allowAllConsent,
  initConsentFromCookies,
  initConsentSideEffects,
  revokeAllConsent,
  updateConsent,
} from './consent'

// Re-export visibility
export {
  type VisibilityState,
  $visibility,
  hideConsentBanner,
  showConsentBanner,
  toggleConsentBanner,
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
  socialEmbedDataConsentRevokeListener,
  type EmbedCacheEntry,
  type EmbedCacheState,
} from './socialEmbeds'
