import { ClientScriptError } from '@components/scripts/errors'
import emailValidator from 'email-validator'
import type { FieldElements } from './@types'
import { showFieldFeedback, clearFieldFeedback } from './feedback'
import {
  isMssgLengthError,
  isMssgLengthWarning,
  mssgLengthErrorText,
  mssgLengthWarningText,
  isNameLengthError,
  nameLengthErrorText,
  invalidEmailAddressText,
  maxLengthEmailAddressText,
  minLengthEmailAddressText,
  missingEmailAddressText,
} from './errorMessages'

type GenericField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

const CUSTOM_FIELDS = new Set(['name', 'email', 'message'])

export const validateNameField = (field: FieldElements<HTMLInputElement>): boolean => {
  const value = field.input.value.trim()

  if (isNameLengthError(value)) {
    showFieldFeedback(field, nameLengthErrorText(), 'error')
    return false
  }

  if (!value) {
    showFieldFeedback(field, 'Please enter your name', 'error')
    return false
  }

  clearFieldFeedback(field)
  return true
}

export const initNameLengthHandler = (field: FieldElements<HTMLInputElement>): void => {
  const handleValidation = () => {
    validateNameField(field)
  }

  field.input.addEventListener('input', handleValidation)
  field.input.addEventListener('blur', handleValidation)
}

export const validateMessageField = (field: FieldElements<HTMLTextAreaElement>): boolean => {
  const value = field.input.value

  if (!value.trim()) {
    showFieldFeedback(field, 'Please describe your project', 'error')
    return false
  }

  if (isMssgLengthError(value)) {
    showFieldFeedback(field, mssgLengthErrorText(), 'error')
    return false
  }

  if (isMssgLengthWarning(value)) {
    showFieldFeedback(field, mssgLengthWarningText(value), 'warning')
    return true
  }

  clearFieldFeedback(field)
  return true
}

export const initMssgLengthHandler = (field: FieldElements<HTMLTextAreaElement>): void => {
  const handleValidation = () => {
    validateMessageField(field)
  }

  field.input.addEventListener('input', handleValidation)
  field.input.addEventListener('blur', handleValidation)
}

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
  const { input } = field

  // Manual fallback for environments without native constraint validation (e.g., JSDOM)
  if (input.minLength > 0 && input.value.length < input.minLength) {
    showFieldFeedback(field, minLengthEmailAddressText(input), 'error')
    return false
  }

  if (input.maxLength > -1 && input.value.length > input.maxLength) {
    showFieldFeedback(field, maxLengthEmailAddressText(input), 'error')
    return false
  }

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

const removeExistingError = (field: GenericField): void => {
  field.classList.remove('error')
  const existing = field.parentNode instanceof HTMLElement ? field.parentNode.querySelector<HTMLElement>('.field-error') : null
  existing?.remove()
}

const showGenericError = (field: GenericField, message: string): void => {
  const wrapper = field.parentNode instanceof HTMLElement ? field.parentNode : null
  if (!wrapper) return

  const errorDiv = document.createElement('div')
  errorDiv.className = 'field-error'
  errorDiv.textContent = message
  errorDiv.style.cssText = 'color: var(--color-danger); font-size: 0.85rem; margin-top: 0.25rem;'
  wrapper.appendChild(errorDiv)
  field.classList.add('error')
}

export const validateGenericField = (field: GenericField): boolean => {
  removeExistingError(field)

  const value = field.value.trim()
  let isValid = true
  let errorMessage = ''

  if (field.hasAttribute('required') && !value) {
    isValid = false
    errorMessage = 'This field is required'
  } else if (field instanceof HTMLInputElement && field.type === 'email' && value) {
    if (!emailValidator.validate(value)) {
      isValid = false
      errorMessage = 'Please enter a valid email address'
    }
  } else if (field.hasAttribute('minlength')) {
    const minLength = Number(field.getAttribute('minlength')) || 0
    if (value.length < minLength) {
      isValid = false
      errorMessage = `Minimum ${minLength} characters required`
    }
  } else if (field.hasAttribute('maxlength')) {
    const maxLength = Number(field.getAttribute('maxlength')) || 0
    if (value.length > maxLength) {
      isValid = false
      errorMessage = `Maximum ${maxLength} characters allowed`
    }
  }

  if (!isValid) {
    showGenericError(field, errorMessage)
  }

  return isValid
}

export const initGenericValidation = (form: HTMLFormElement): void => {
  const inputs = form.querySelectorAll<GenericField>('input, select, textarea')
  inputs.forEach(input => {
    if (CUSTOM_FIELDS.has(input.id)) {
      return
    }

    input.addEventListener('blur', () => {
      validateGenericField(input)
    })

    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        validateGenericField(input)
      }
    })
  })
}

export const validateGenericFields = (form: HTMLFormElement): boolean => {
  const inputs = form.querySelectorAll<GenericField>('input, select, textarea')
  return Array.from(inputs).reduce<boolean>((isValid, input) => {
    if (CUSTOM_FIELDS.has(input.id)) {
      return isValid
    }
    return validateGenericField(input) && isValid
  }, true)
}
