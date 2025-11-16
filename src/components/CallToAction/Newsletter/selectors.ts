import {
  isFormElement,
  isInputElement,
  isButtonElement,
  isSpanElement,
} from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'

export const SELECTORS = {
  form: '#newsletter-form',
  emailInput: '#newsletter-email',
  consentCheckbox: '#newsletter-gdpr-consent',
  submitButton: '#newsletter-submit',
  buttonText: '#button-text',
  buttonArrow: '#button-arrow',
  buttonSpinner: '#button-spinner',
  message: '#newsletter-message',
} as const

/**
 * Get newsletter form elements with type validation
 */
export function getNewsletterElements(context: Element) {
  const form = context.querySelector(SELECTORS.form)
  if (!isFormElement(form)) {
    throw new ClientScriptError({
      scriptName: 'NewsletterFormElement',
      operation: 'getNewsletterElements',
      message: 'Newsletter form element not found',
    })
  }

  const emailInput = context.querySelector(SELECTORS.emailInput)
  if (!isInputElement(emailInput)) {
    throw new ClientScriptError({
      scriptName: 'NewsletterFormElement',
      operation: 'getNewsletterElements',
      message: 'Email input element not found',
    })
  }

  const consentCheckbox = context.querySelector(SELECTORS.consentCheckbox)
  if (!isInputElement(consentCheckbox)) {
    throw new ClientScriptError({
      scriptName: 'NewsletterFormElement',
      operation: 'getNewsletterElements',
      message: 'Consent checkbox element not found',
    })
  }

  const submitButton = context.querySelector(SELECTORS.submitButton)
  if (!isButtonElement(submitButton)) {
    throw new ClientScriptError({
      scriptName: 'NewsletterFormElement',
      operation: 'getNewsletterElements',
      message: 'Submit button element not found',
    })
  }

  const buttonText = context.querySelector(SELECTORS.buttonText)
  if (!isSpanElement(buttonText)) {
    throw new ClientScriptError({
      scriptName: 'NewsletterFormElement',
      operation: 'getNewsletterElements',
      message: 'Button text span element not found',
    })
  }

  const buttonArrow = context.querySelector(SELECTORS.buttonArrow)
  if (!(buttonArrow instanceof SVGSVGElement)) {
    throw new ClientScriptError({
      scriptName: 'NewsletterFormElement',
      operation: 'getNewsletterElements',
      message: 'Button arrow SVG element not found',
    })
  }

  const buttonSpinner = context.querySelector(SELECTORS.buttonSpinner)
  if (!(buttonSpinner instanceof SVGSVGElement)) {
    throw new ClientScriptError({
      scriptName: 'NewsletterFormElement',
      operation: 'getNewsletterElements',
      message: 'Button spinner SVG element not found',
    })
  }

  const message = context.querySelector(SELECTORS.message)
  if (!(message instanceof HTMLParagraphElement)) {
    throw new ClientScriptError({
      scriptName: 'NewsletterFormElement',
      operation: 'getNewsletterElements',
      message: 'Message paragraph element not found',
    })
  }

  return {
    form,
    emailInput,
    consentCheckbox,
    submitButton,
    buttonText,
    buttonArrow,
    buttonSpinner,
    message,
  }
}
