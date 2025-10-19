/**
 * State used for the Cookie Consent modal
 * Now uses centralized state store from lib/state
 */
import { $cookieModalVisible } from '@lib/state'

export const consentModalStateKey = `COOKIE_MODAL_VISIBLE`

export const getCookieModalVisibility = () => {
  return $cookieModalVisible.get()
}

export const setCookieModalVisibility = (visible: boolean) => {
  $cookieModalVisible.set(visible)
}

export const initCookieModalVisibility = () => {
  $cookieModalVisible.set(true)
}
