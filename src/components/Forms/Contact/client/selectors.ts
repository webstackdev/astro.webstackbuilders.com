import { ClientScriptError } from '@components/scripts/errors'
import {
  isButtonElement,
  isFormElement,
  isInputElement,
} from '@components/scripts/assertions/elements'
import type { ContactFormElements, FieldElements } from './@types'

const FIELD_ERROR_SELECTOR = (field: string) => `[data-field-error="${field}"]`

const getFieldElements = <T extends HTMLInputElement | HTMLTextAreaElement>(
  input: T,
  label: HTMLLabelElement | null,
  feedback: HTMLElement | null,
  fieldName: string
): FieldElements<T> => {
  if (!label) {
    throw new ClientScriptError(`Contact form label missing for field: ${fieldName}`)
  }

  if (!feedback) {
    throw new ClientScriptError(`Contact form feedback container missing for field: ${fieldName}`)
  }

  return {
    input,
    label,
    feedback,
  }
}

export const getContactFormElements = (): ContactFormElements => {
  const form = document.getElementById('contactForm')
  if (!isFormElement(form)) {
    throw new ClientScriptError('ContactForm: Form element not found. Contact form cannot function without the form element.')
  }

  const messages = document.getElementById('formMessages')
  const successMessage = messages?.querySelector('.message-success')
  const errorMessage = messages?.querySelector('.message-error')
  const errorText = document.getElementById('errorMessage')
  const submitBtn = document.getElementById('submitBtn')
  const btnText = submitBtn?.querySelector('.btn-text')
  const btnLoading = submitBtn?.querySelector('.btn-loading')
  const messageTextarea = document.getElementById('message')
  const charCount = document.getElementById('charCount')
  const uppyContainer = document.getElementById('uppyContainer')
  const formErrorBanner = document.getElementById('formErrorBanner')

  if (
    !(messages instanceof HTMLElement) ||
    !(successMessage instanceof HTMLElement) ||
    !(errorMessage instanceof HTMLElement) ||
    !(errorText instanceof HTMLElement) ||
    !isButtonElement(submitBtn) ||
    !(btnText instanceof HTMLElement) ||
    !(btnLoading instanceof HTMLElement) ||
    !(messageTextarea instanceof HTMLTextAreaElement) ||
    !(charCount instanceof HTMLElement) ||
    !(formErrorBanner instanceof HTMLElement)
  ) {
    throw new ClientScriptError('ContactForm: Required DOM elements not found. Form requires all elements to function.')
  }

  const nameInput = document.getElementById('name')
  const emailInput = document.getElementById('email')

  if (!isInputElement(nameInput) || !isInputElement(emailInput)) {
    throw new ClientScriptError('ContactForm: Required input elements missing')
  }

  const nameLabel = document.querySelector<HTMLLabelElement>('label[for="name"]')
  const emailLabel = document.querySelector<HTMLLabelElement>('label[for="email"]')
  const messageLabel = document.querySelector<HTMLLabelElement>('label[for="message"]')

  const nameFeedback = document.querySelector<HTMLElement>(FIELD_ERROR_SELECTOR('name'))
  const emailFeedback = document.querySelector<HTMLElement>(FIELD_ERROR_SELECTOR('email'))
  const messageFeedback = document.querySelector<HTMLElement>(FIELD_ERROR_SELECTOR('message'))

  const fields = {
    name: getFieldElements(nameInput, nameLabel, nameFeedback, 'name'),
    email: getFieldElements(emailInput, emailLabel, emailFeedback, 'email'),
    message: getFieldElements(messageTextarea, messageLabel, messageFeedback, 'message'),
  }

  return {
    form,
    messages,
    successMessage,
    errorMessage,
    errorText,
    submitBtn,
    btnText,
    btnLoading,
    messageTextarea,
    charCount,
    uppyContainer,
    formErrorBanner,
    fields,
  }
}
