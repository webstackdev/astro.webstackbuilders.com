import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  hideErrorBanner,
  showErrorBanner,
  clearFieldFeedback,
  showFieldFeedback,
  type LabelController,
} from './feedback'
import { validateGenericFields, validateNameField, validateMessageField } from './validation'
import type { ContactFormElements } from './@types'
import { validateEmailField } from './email'
import { actions, isInputError } from 'astro:actions'
import type { UploadController } from './upload'
import { queryContactFormGeneratedFieldError, queryContactFormGenericFields } from './selectors'

export type ContactUiState = 'idle' | 'loading' | 'success' | 'error' | 'validation'

export const contactPreviewStates = ['loading', 'success', 'error', 'validation'] as const

type ContactPreviewState = (typeof contactPreviewStates)[number]

interface SubmissionControllers {
  labelController: LabelController
  uploadController?: UploadController | null
  rootElement?: HTMLElement | null
}

export const appendUploadFiles = (
  formData: FormData,
  uploadController?: UploadController | null
): void => {
  const files = uploadController?.getFiles() ?? []
  const maxFiles = 5
  files.slice(0, maxFiles).forEach((file, index) => {
    formData.set(`file${index + 1}`, file)
  })
}

const hideMessages = (elements: ContactFormElements): void => {
  elements.messages.style.display = 'none'
}

const setContactState = (
  rootElement: HTMLElement | null | undefined,
  state: ContactUiState
): void => {
  rootElement?.setAttribute('data-contact-state', state)
}

const showSuccessMessage = (elements: ContactFormElements): void => {
  elements.messages.style.display = 'block'
  elements.successMessage.classList.remove('hidden')
  elements.errorMessage.classList.add('hidden')
}

const showErrorMessage = (elements: ContactFormElements, message: string): void => {
  elements.messages.style.display = 'block'
  elements.successMessage.classList.add('hidden')
  elements.errorMessage.classList.remove('hidden')
  elements.errorMessage.style.display = 'block'
  elements.errorText.textContent = message
}

const setLoading = (elements: ContactFormElements, loading: boolean): void => {
  elements.submitBtn.disabled = loading

  if (loading) {
    elements.btnText.style.display = 'none'
    elements.btnLoading.classList.remove('hidden')
    elements.btnLoading.style.display = 'flex'
  } else {
    elements.btnText.style.display = 'inline'
    elements.btnLoading.classList.add('hidden')
    elements.btnLoading.style.display = 'none'
  }
}

const clearGeneratedGenericErrors = (elements: ContactFormElements): void => {
  queryContactFormGenericFields(elements.form).forEach(field => {
    field.classList.remove('error')
    field.setAttribute('aria-invalid', 'false')
    field.removeAttribute('aria-errormessage')
    queryContactFormGeneratedFieldError(field)?.remove()
  })
}

const resetSubmissionFeedback = (elements: ContactFormElements): void => {
  hideMessages(elements)
  hideErrorBanner(elements.formErrorBanner)
  setLoading(elements, false)
  clearGeneratedGenericErrors(elements)
  Object.values(elements.fields).forEach(clearFieldFeedback)
}

export const resolveContactPreviewState = (search: string): ContactPreviewState | null => {
  const params = new URLSearchParams(search)
  const previewState = params.get('contactState')?.trim().toLowerCase()

  if (!previewState) {
    return null
  }

  return contactPreviewStates.includes(previewState as ContactPreviewState)
    ? (previewState as ContactPreviewState)
    : null
}

export const applyContactPreviewState = (
  elements: ContactFormElements,
  options: {
    state: ContactPreviewState
    rootElement?: HTMLElement | null
  }
): void => {
  resetSubmissionFeedback(elements)

  switch (options.state) {
    case 'loading':
      setLoading(elements, true)
      setContactState(options.rootElement, 'loading')
      return

    case 'success':
      showSuccessMessage(elements)
      setContactState(options.rootElement, 'success')
      return

    case 'error':
      showErrorMessage(elements, 'Unable to send message. Please try again later.')
      setContactState(options.rootElement, 'error')
      return

    case 'validation':
      showFieldFeedback(elements.fields.name, 'Please enter your name', 'error')
      showFieldFeedback(elements.fields.email, 'Please enter a valid email address.', 'error')
      showFieldFeedback(elements.fields.message, 'Please describe your project', 'error')
      showErrorBanner(elements.formErrorBanner)
      showErrorMessage(elements, 'Please correct the highlighted fields and try again.')
      setContactState(options.rootElement, 'validation')
      return
  }
}

const runFieldValidations = (elements: ContactFormElements): boolean => {
  const validations = [
    validateEmailField(elements.fields.email),
    validateNameField(elements.fields.name),
    validateMessageField(elements.fields.message),
    validateGenericFields(elements.form),
  ]

  return validations.every(Boolean)
}

type ContactActionInputError = {
  fields: Record<string, string[]>
}

const showActionInputErrors = (elements: ContactFormElements, error: unknown): boolean => {
  if (!isInputError(error)) return false

  // Astro Actions input errors provide per-field messages via `error.fields`.
  // We surface those messages through the existing field feedback UI.
  Object.values(elements.fields).forEach(clearFieldFeedback)

  const fields = (error as ContactActionInputError).fields
  Object.entries(fields).forEach(([fieldName, messages]) => {
    const fieldKey = fieldName as keyof typeof elements.fields
    const field = elements.fields[fieldKey]
    if (!field) return

    const message = Array.isArray(messages) ? messages.filter(Boolean).join(' ') : ''
    if (!message) return
    // Field-level feedback is already styled and sets `aria-invalid`.
    // We keep it as a single string to avoid adding extra DOM nodes.
    showFieldFeedback(field, message, 'error')
  })

  showErrorBanner(elements.formErrorBanner)
  showErrorMessage(elements, 'Please correct the highlighted fields and try again.')
  return true
}

const resetFormState = (
  elements: ContactFormElements,
  controllers: SubmissionControllers
): void => {
  elements.form.reset()
  elements.charCount.textContent = '0'
  elements.charCount.removeAttribute('style')
  controllers.labelController.sync()
  controllers.uploadController?.reset()
  Object.values(elements.fields).forEach(clearFieldFeedback)
}

export const initFormSubmission = (
  elements: ContactFormElements,
  controllers: SubmissionControllers
): void => {
  const context = { scriptName: 'ContactFormElement', operation: 'handleFormSubmission' }

  elements.form.addEventListener('submit', async event => {
    event.preventDefault()
    addScriptBreadcrumb(context)

    try {
      Object.values(elements.fields).forEach(clearFieldFeedback)
      const isValid = runFieldValidations(elements)

      if (!isValid) {
        showErrorBanner(elements.formErrorBanner)
        setContactState(controllers.rootElement, 'validation')
        return
      }

      hideErrorBanner(elements.formErrorBanner)
      setLoading(elements, true)
      hideMessages(elements)
      setContactState(controllers.rootElement, 'loading')

      try {
        const formData = new FormData(elements.form)
        appendUploadFiles(formData, controllers.uploadController)
        const { data, error } = await actions.contact.submit(formData)
        if (showActionInputErrors(elements, error)) {
          setContactState(controllers.rootElement, 'validation')
          return
        }

        if (error || !data || !data.success) {
          showErrorMessage(
            elements,
            error?.message || data?.message || 'An error occurred while sending your message.'
          )
          setContactState(controllers.rootElement, 'error')
          return
        }

        showSuccessMessage(elements)
        setContactState(controllers.rootElement, 'success')

        elements.submitBtn.dispatchEvent(
          new CustomEvent('confetti:fire', {
            bubbles: true,
            composed: true,
          })
        )

        resetFormState(elements, controllers)
      } catch (error) {
        handleScriptError(error, context)
        showErrorMessage(elements, 'Unable to send message. Please try again later.')
        setContactState(controllers.rootElement, 'error')
      } finally {
        setLoading(elements, false)
      }
    } catch (error) {
      handleScriptError(error, context)
      setLoading(elements, false)
      setContactState(controllers.rootElement, 'error')
    }
  })
}
