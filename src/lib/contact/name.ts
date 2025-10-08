import { isNameLengthError, nameLengthErrorText } from './error'
import type { ContactFormSelectors } from './selectors'

// @TODO: Change length warning from a text message to a Twitter-like circle with characters remaining
// @TODO: Prevent text beyond max length being added to box. This can be done with e.preventDefault(), but it needs to account for paste actions and add the amount of text in the selection being pasted up to the max length and add that text.

export const initNameLengthHandler = (selector: ContactFormSelectors) => {
  selector.nameInputElement.addEventListener(`input`, nameInputElementValidator(selector))
}

/**
 * Length of the text in the message <textarea> control is the only validation
 * error checked for. If other validation errors are added, the last `else if`
 * needs updated here.
 */
export const nameInputElementValidator = (selector: ContactFormSelectors) => () => {
  const nameInputElement = selector.nameInputElement
  const errorContainer = selector.nameValidationError
  const hasError = errorContainer.classList.contains(`error`)

  const nameText = nameInputElement.value
  if (isNameLengthError(nameText) && !hasError) {
    errorContainer.classList.add(`error`)
    errorContainer.innerText = nameLengthErrorText()
  } else if (nameText.length) {
    /** Clear error if none required */
    errorContainer.classList.remove(`error`)
    errorContainer.innerText = ``
  }
}
