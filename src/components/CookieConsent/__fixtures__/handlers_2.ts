import { showCookieConsentModal } from '../handlers'

try {
  showCookieConsentModal()
} catch (err) {
  /** Pass error message back to test */
  document.querySelector(`body`)!.innerHTML = (err as Error).message
}
