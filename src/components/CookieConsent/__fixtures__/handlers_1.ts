import { handleDismissCookieModal } from '../handlers'

localStorage.setItem(`COOKIE_MODAL_VISIBLE`, `true`)

try {
  handleDismissCookieModal()
} catch (err) {
  /** Pass error message back to test */
  document.querySelector(`body`)!.innerHTML = (err as Error).message
}
