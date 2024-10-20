import { getCookieConsentAllowLink } from '../getters'

try {
  const link = getCookieConsentAllowLink()
  link.setAttribute(`data-testid`, `test-element`)
} catch (err) {
  /** Pass error message back to test */
  document.querySelector(`body`)!.innerHTML = (err as Error).message
}
