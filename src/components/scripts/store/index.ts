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
  type ConsentState,
  type ConsentValue,
  $consent,
  $hasAdvertisingConsent,
  $hasAnalyticsConsent,
  $hasAnyConsent,
  $hasFunctionalConsent,
  allowAllConsent,
  initConsentFromCookies,
  revokeAllConsent,
  updateConsent,
} from './consent'

// Re-export visibility
export {
  type VisibilityState,
  $visibility,
  $isConsentBannerVisible,
  showConsentBanner,
  hideConsentBanner,
  toggleConsentBanner,
} from './visibility'

// Re-export themes
export {
  $theme,
  $themePickerOpen,
  setTheme,
  type ThemeId,
} from './themes'

// Re-export Mastodon instances
export {
  $mastodonInstances,
  $currentMastodonInstance,
  saveMastodonInstance,
  removeMastodonInstance,
  clearMastodonInstances,
} from './mastodonInstances'

// Re-export social embeds
export {
  $embedCache,
  cacheEmbed,
  clearEmbedCache,
  type EmbedCacheEntry,
  type EmbedCacheState,
  getCachedEmbed,
} from './socialEmbeds'
