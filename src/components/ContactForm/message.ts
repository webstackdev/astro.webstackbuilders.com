/**
 * Event handler for the text area element to give a warning when close to max
 * limit but not at it. Give error message when limit reached.
 */
import {
  isMssgLengthWarning,
  isMssgLengthError,
  mssgLengthWarningText,
  mssgLengthErrorText
} from './error'
import type { ContactFormSelectors } from './selectors'

// @TODO: Change length warning from a text message to a Twitter-like circle with characters remaining
// @TODO: Prevent text beyond max length being added to box. This can be done with e.preventDefault(), but it needs to account for paste actions and add the amount of text in the selection being pasted up to the max length and add that text.

export const initMssgLengthHandler = (selector: ContactFormSelectors) => {
  selector.messageInputElement.addEventListener(
    `input`,
    messageInputElementValidator(selector)
  )
}

/**
 * Length of the text in the message <textarea> control is the only validation
 * error checked for. If other validation errors are added, the last `else if`
 * needs updated here.
 */
export const messageInputElementValidator = (selector: ContactFormSelectors) => () => {
  const messageInputElement = selector.messageInputElement
  const errorContainer = selector.messageValidationError
  const hasWarning = errorContainer.classList.contains(`warning`)
  const hasError = errorContainer.classList.contains(`error`)
  const mssgText = messageInputElement.value
  if (isMssgLengthError(mssgText) && !hasError) {
    /** Clear warning if transitioning from warning state to error state */
    errorContainer.classList.remove(`warning`)
    errorContainer.classList.add(`error`)
    errorContainer.innerText = mssgLengthErrorText()
  } else if (isMssgLengthWarning(mssgText) && !hasWarning) {
    /** Clear error if transitioning from error state to warning state */
    errorContainer.classList.remove(`error`)
    errorContainer.classList.add(`warning`)
    errorContainer.innerText = mssgLengthWarningText(mssgText)
  } else if (mssgText.length) {
    /** Clear error or warning if none required */
    errorContainer.classList.remove(`error`, `warning`)
    errorContainer.innerText = ``
  }
}
