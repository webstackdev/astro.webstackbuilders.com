/**
 * Error messages used in both message warning and submit validation
 */
export const messageWarnLength = 1800
export const messageMaxLength = 2000

export const isMssgLengthWarning = (mssg: string) => {
  if (mssg.length > messageWarnLength && mssg.length < messageMaxLength) return true
  return false
}

export const isMssgLengthError = (mssg: string) => {
  if (mssg.length >= messageMaxLength) return true
  return false
}

export const mssgLengthWarningText = (mssg: string) => {
  return `You're close to the max length of a message, only ${mssg.length - messageMaxLength} characters remaining`
}

export const mssgLengthErrorText = () => {
  return `Messages are limited to 2K characters, yours is too long`
}

/**
 * Error messages used in name form control validation
 */

export const nameMaxLength = 50

export const isNameLengthError = (mssg: string) => {
  if (mssg.length >= nameMaxLength) return true
  return false
}

export const nameLengthErrorText = () => {
  return `Your name is too long, maximum length is ${nameMaxLength} characters`
}

/**
 * Error messages used in email form control validation
 */

export const missingEmailAddressText = () => {
  return `Please enter an email address`
}

export const invalidEmailAddressText = () => {
  return `Entered value needs to be an email address`
}

export const maxLengthEmailAddressText = (emailInputElement: HTMLInputElement) => {
  return `Email should be less than ${emailInputElement.maxLength} characters; you entered ${emailInputElement.value.length}.`
}

export const minLengthEmailAddressText = (emailInputElement: HTMLInputElement) => {
  return `Email should be at least ${emailInputElement.minLength} characters; you entered ${emailInputElement.value.length}.`
}

/**
 * Error message used for form error wrapper on submit
 */
export const getInvalidFormText = () => {
  return `Please fix the errors in your message and hit the submit button again`
}
