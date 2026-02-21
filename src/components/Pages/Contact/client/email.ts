import { ClientScriptError } from '@components/scripts/errors'
import type { FieldElements } from './@types'
import { showFieldFeedback, clearFieldFeedback } from './feedback'
import {
  invalidEmailAddressText,
  maxLengthEmailAddressText,
  minLengthEmailAddressText,
  missingEmailAddressText,
} from './errorMessages'

const getEmailErrorText = (input: HTMLInputElement): string => {
  if (input.validity.valueMissing) {
    return missingEmailAddressText()
  }

  if (input.validity.typeMismatch) {
    return invalidEmailAddressText()
  }

  if (input.validity.tooShort) {
    return minLengthEmailAddressText(input)
  }

  if (input.validity.tooLong) {
    return maxLengthEmailAddressText(input)
  }

  throw new ClientScriptError('Unknown email validation error')
}

export const validateEmailField = (field: FieldElements<HTMLInputElement>): boolean => {
  if (!field.input.validity.valid) {
    showFieldFeedback(field, getEmailErrorText(field.input), 'error')
    return false
  }

  clearFieldFeedback(field)
  return true
}

export const initEmailValidationHandler = (field: FieldElements<HTMLInputElement>): void => {
  const handleValidation = () => {
    validateEmailField(field)
  }

  field.input.addEventListener('input', handleValidation)
  field.input.addEventListener('blur', handleValidation)
}
