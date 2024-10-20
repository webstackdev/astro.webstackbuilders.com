import { getCookieConsentAllowBtn } from '../getters'

try {
  const button = getCookieConsentAllowBtn()
  button.setAttribute(`data-testid`, `test-element`)
} catch (err) {
  /** Pass error message back to test */
  document.querySelector(`body`)!.innerHTML = (err as Error).message
}
