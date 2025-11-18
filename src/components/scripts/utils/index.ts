/**
 * Scripts Utils - Barrel Export
 * Single source for all utility functions
 */
export {
  type CookieOptions,
  getCookie,
  setCookie,
  removeCookie,
  getAllCookies,
} from './cookies'

export {
  getOrCreateDataSubjectId,
  deleteDataSubjectId,
} from './dataSubjectId'

/**
 * !!!! DO NOT RE-EXPORT environmentClient.ts or siteUrlClient.ts methods here !!!!!
 *
 * Their use of "astro:env/client" causes Rollup problems in splitting the bundle
 * when the methods are imported from this barrel file into both client and API contexts.
 */
