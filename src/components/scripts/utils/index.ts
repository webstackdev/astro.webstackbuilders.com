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

export {
  isUnitTest,
  isE2eTest,
  isTest,
  isDev,
  isProd,
} from './environmentClient'

export { getSiteUrl} from './siteUrlClient'
