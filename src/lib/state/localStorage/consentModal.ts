/**
 * State used for the Cookie Consent modal
 */

/** local storage only allows string values for keys */
interface VisibilityObject {
  visible: boolean
}

export const consentModalStateKey = `COOKIE_MODAL_VISIBLE`

export function isVisibilityObject(input: unknown): input is VisibilityObject {
  if (!input || typeof input !== 'object') return false
  return Object.prototype.hasOwnProperty.call(input, 'visible')
}

export const getCookieModalVisibility = () => {
  const item = JSON.parse(localStorage.getItem(consentModalStateKey) || ``)
  if (!isVisibilityObject(item))
    throw new Error(`The 'COOKIE_MODAL_VISIBLE' value in local storage was read before it was set`)
  return item.visible
}

export const setCookieModalVisibility = (visible: boolean) => {
  localStorage.setItem(consentModalStateKey, JSON.stringify({ visible }))
}

export const initCookieModalVisibility = () => {
  setCookieModalVisibility(true)
}
