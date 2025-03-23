import { ContactFormSelectors } from '../selectors'

try {
  const selectors = new ContactFormSelectors()
  const wrapper = selectors.submitButton
  wrapper.setAttribute(`data-testid`, `test-element`)
} catch (err) {
  /** Pass error message back to test */
  document.querySelector(`body`)!.innerHTML = (err as Error).message
}
