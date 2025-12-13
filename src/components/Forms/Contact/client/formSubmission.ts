import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { hideErrorBanner, showErrorBanner, clearFieldFeedback, type LabelController } from './feedback'
import { validateGenericFields, validateNameField, validateMessageField } from './validation'
import type { ContactFormConfig, ContactFormElements } from './@types'
import { validateEmailField } from './email'

interface SubmissionControllers {
  labelController: LabelController
}

const hideMessages = (elements: ContactFormElements): void => {
  elements.messages.style.display = 'none'
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
  elements.errorMessage.style.display = 'flex'
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

const runFieldValidations = (elements: ContactFormElements): boolean => {
  const validations = [
    validateEmailField(elements.fields.email),
    validateNameField(elements.fields.name),
    validateMessageField(elements.fields.message),
    validateGenericFields(elements.form),
  ]

  return validations.every(Boolean)
}

const resetFormState = (elements: ContactFormElements, controllers: SubmissionControllers): void => {
  elements.form.reset()
  elements.charCount.textContent = '0'
  elements.charCount.removeAttribute('style')
  controllers.labelController.sync()
  Object.values(elements.fields).forEach(clearFieldFeedback)
}

export const initFormSubmission = (
  elements: ContactFormElements,
  config: ContactFormConfig,
  controllers: SubmissionControllers,
): void => {
  const context = { scriptName: 'ContactFormElement', operation: 'handleFormSubmission' }

  elements.form.addEventListener('submit', async event => {
    event.preventDefault()
    addScriptBreadcrumb(context)

    try {
      const isValid = runFieldValidations(elements)

      if (!isValid) {
        showErrorBanner(elements.formErrorBanner)
        return
      }

      hideErrorBanner(elements.formErrorBanner)
      setLoading(elements, true)
      hideMessages(elements)

      try {
        const formData = new FormData(elements.form)
        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (response.ok && result.success) {
          showSuccessMessage(elements)

          elements.submitBtn.dispatchEvent(
            new CustomEvent('confetti:fire', {
              bubbles: true,
              composed: true,
            }),
          )

          resetFormState(elements, controllers)
        } else {
          showErrorMessage(elements, result.message || 'An error occurred while sending your message.')
        }
      } catch (error) {
        handleScriptError(error, context)
        showErrorMessage(elements, 'Unable to send message. Please try again later.')
      } finally {
        setLoading(elements, false)
      }
    } catch (error) {
      handleScriptError(error, context)
      setLoading(elements, false)
    }
  })
}
