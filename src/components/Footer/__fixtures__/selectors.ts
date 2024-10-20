import { getHireMeAnchorElement } from '../selectors'

try {
  const wrapper = getHireMeAnchorElement()
  wrapper.setAttribute(`data-testid`, `test-element`)
} catch (err) {
  /** Pass error message back to test */
  document.querySelector(`body`)!.innerHTML = (err as Error).message
}
