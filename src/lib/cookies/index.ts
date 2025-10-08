/**
 * Cookie utilities and managers
 * Centralized exports for cookie-related functionality
 */

export { CookiePreferencesManager, initializeCookiePreferences } from './cookie-preferences'
export type { CookiePreferences } from './cookie-preferences'

// Note: cookie-manager.ts exports are not included in the main index
// as they may be used independently or have different usage patterns