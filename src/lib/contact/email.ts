import {
  missingEmailAddressText,
  invalidEmailAddressText,
  maxLengthEmailAddressText,
  minLengthEmailAddressText,
} from './error'
import type { ContactFormSelectors } from './selectors'

export const initEmailValidationHandler = (selector: ContactFormSelectors) => {
  selector.emailInputElement.addEventListener(`input`, emailInputElementValidator(selector))
}

export const emailInputElementValidator = (selector: ContactFormSelectors) => () => {
  const emailInputElement = selector.emailInputElement!
  const errorContainer = selector.emailValidationError
  const hasError = errorContainer.classList.contains(`error`)

  if (!emailInputElement.validity.valid && !hasError) {
    errorContainer.classList.add(`error`)
    errorContainer.innerText = getEmailErrorText(emailInputElement)
  } else if (emailInputElement.validity.valid && hasError) {
    /** Clear error if it's set */
    errorContainer.classList.remove(`error`)
    errorContainer.innerText = ``
  }
}

const getEmailErrorText = (emailInputElement: HTMLInputElement) => {
  if (emailInputElement.validity.valueMissing) {
    /** If the field is empty, display the following error message */
    return missingEmailAddressText()
  } else if (emailInputElement.validity.typeMismatch) {
    /** If the field doesn't contain an email address, display the following error message */
    return invalidEmailAddressText()
  } else if (emailInputElement.validity.tooShort) {
    /** If the data is too short, display the following error message */
    return minLengthEmailAddressText(emailInputElement)
    } else if (emailInputElement.validity.tooLong) {
    /** If the data is too long, display the following error message */
    return maxLengthEmailAddressText(emailInputElement)
  } else {
    throw new Error()
  }
}
