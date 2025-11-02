/**
 * Central State Management - Barrel Export
 * Single source of truth for all client-side state
 */

// Re-export types
export type {
  ConsentCategory,
  ConsentValue,
  ThemeId,
  ConsentState,
  EmbedCacheEntry,
  EmbedCacheState,
} from './store/@types'

// Re-export cookie consent
export {
  $consent,
  $cookieModalVisible,
  $hasAnalyticsConsent,
  $hasFunctionalConsent,
  $hasAdvertisingConsent,
  $hasAnyConsent,
  initConsentFromCookies,
  updateConsent,
  allowAllConsent,
  revokeAllConsent,
} from './store/cookieConsent'

// Re-export themes
export { $theme, $themePickerOpen, setTheme } from './store/themes'

// Re-export Mastodon instances
export {
  $mastodonInstances,
  $currentMastodonInstance,
  saveMastodonInstance,
  removeMastodonInstance,
  clearMastodonInstances,
} from './store/mastodonInstances'

// Re-export social embeds
export { $embedCache, cacheEmbed, getCachedEmbed, clearEmbedCache } from './store/socialEmbeds'
