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
} from './@types'

// Re-export cookie consent
export {
  $consent,
  $cookieModalVisible,
  $hasAnalyticsConsent,
  $hasFunctionalConsent,
  $hasAdvertisingConsent,
  $hasAnyConsent,
  initConsentFromCookies,
  initConsentSideEffects,
  updateConsent,
  allowAllConsent,
  revokeAllConsent,
} from './cookieConsent'

// Re-export themes
export {
  $theme,
  $themePickerOpen,
  initThemeSideEffects,
  setTheme,
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
export { $embedCache, cacheEmbed, getCachedEmbed, clearEmbedCache } from './socialEmbeds'
