import { getCookieConsentCustomizeBtn } from '../getters'

try {
  const button = getCookieConsentCustomizeBtn()
  button.setAttribute(`data-testid`, `test-element`)
} catch (err) {
  /** Pass error message back to test */
  document.querySelector(`body`)!.innerHTML = (err as Error).message
}
