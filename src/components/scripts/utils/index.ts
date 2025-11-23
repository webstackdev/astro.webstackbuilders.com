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

export { absoluteUrl } from './absoluteUrl'

export { defineCustomElement } from './defineCustomElement'

/**
 * !!!! DO NOT RE-EXPORT environmentClient.ts OR siteUrlClient.ts METHODS HERE !!!!!
 *
 * Their use of "astro:env/client" causes Rollup problems in splitting the bundle
 * when the methods are imported from this barrel file into both client and API contexts.
 */
