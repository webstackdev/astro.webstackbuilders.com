/**
 * Scripts Utils - Barrel Export
 * Single source for all utility functions
 */

// Re-export cookie utilities
export {
  type CookieOptions,
  getCookie,
  setCookie,
  removeCookie,
  getAllCookies,
} from './cookies'

// Re-export data subject ID utilities
export {
  getOrCreateDataSubjectId,
  deleteDataSubjectId,
} from './dataSubjectId'