import { getCookieConsentWrapper } from '../getters'

try {
  const wrapper = getCookieConsentWrapper()
  wrapper.setAttribute(`data-testid`, `test-element`)
} catch (err) {
  /** Pass error message back to test */
  document.querySelector(`body`)!.innerHTML = (err as Error).message
}
