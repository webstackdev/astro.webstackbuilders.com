/**
 * Set opacity to 0 on the input labels when the user types something
 * in the input box so the label doesn't show while the user's typing,
 * and set it back to 0.5 if they clear the input.
 */
import { type ContactFormSelectors, formControlGroupSelectors } from './selectors'
// e.target.value
export const isEmpty = (formControl: HTMLInputElement) => !formControl.value.trim().length
export const initLabelHandlers = (selector: ContactFormSelectors) => {
  formControlGroupSelectors.forEach(selectorGroup => {
    const controlLabel = selector[selectorGroup.labelElement] as HTMLLabelElement
    const formControl = selector[selectorGroup.formControl] as HTMLInputElement
    formControl.addEventListener(`input`, _ => {
      const hasText = !isEmpty(formControl)
      if (hasText && controlLabel.style.opacity !== `0`) {
        controlLabel.style.opacity = `0`
      }
      if (isEmpty(formControl) && controlLabel.style.opacity === `0`) {
        controlLabel.style.opacity = `0.5`
      }
    })
  })
}
