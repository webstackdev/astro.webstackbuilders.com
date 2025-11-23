/**
 * Shared error and warning copy for the Contact Form
 */
export const messageWarnLength = 1800
export const messageMaxLength = 2000

export const isMssgLengthWarning = (message: string): boolean => {
  return message.length > messageWarnLength && message.length < messageMaxLength
}

export const isMssgLengthError = (message: string): boolean => {
  return message.length >= messageMaxLength
}

export const mssgLengthWarningText = (message: string): string => {
  return `You're close to the max length of a message, only ${messageMaxLength - message.length} characters remaining`
}

export const mssgLengthErrorText = (): string => {
  return 'Messages are limited to 2K characters, yours is too long'
}

export const nameMaxLength = 50

export const isNameLengthError = (name: string): boolean => {
  return name.length >= nameMaxLength
}

export const nameLengthErrorText = (): string => {
  return `Your name is too long, maximum length is ${nameMaxLength} characters`
}

export const missingEmailAddressText = (): string => 'Please enter an email address'

export const invalidEmailAddressText = (): string => 'Entered value needs to be an email address'

export const maxLengthEmailAddressText = (input: HTMLInputElement): string => {
  return `Email should be less than ${input.maxLength} characters; you entered ${input.value.length}.`
}

export const minLengthEmailAddressText = (input: HTMLInputElement): string => {
  return `Email should be at least ${input.minLength} characters; you entered ${input.value.length}.`
}

export const getInvalidFormText = (): string => {
  return 'Please fix the errors in your message and hit the submit button again'
}
