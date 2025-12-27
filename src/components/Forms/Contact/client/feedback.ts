import type { ContactFormFields, FieldElements } from './@types'

export type FieldErrorLevel = 'error' | 'warning'

const WARNING_COLOR = 'var(--color-warning)'
const ERROR_COLOR = 'var(--color-danger)'

export const showErrorBanner = (banner: HTMLElement): void => {
  banner.classList.remove('hidden')
}

export const hideErrorBanner = (banner: HTMLElement): void => {
  banner.classList.add('hidden')
}

export const showFieldFeedback = (
  field: FieldElements<HTMLInputElement | HTMLTextAreaElement>,
  message: string,
  level: FieldErrorLevel
): void => {
  field.feedback.textContent = message
  field.feedback.classList.remove('hidden')
  field.feedback.style.color = level === 'warning' ? WARNING_COLOR : ERROR_COLOR
  field.feedback.dataset['state'] = level

  if (level === 'error') {
    field.input.classList.add('error')
    field.input.setAttribute('aria-invalid', 'true')
  } else {
    field.input.classList.remove('error')
    field.input.setAttribute('aria-invalid', 'false')
  }
}

export const clearFieldFeedback = (
  field: FieldElements<HTMLInputElement | HTMLTextAreaElement>
): void => {
  field.feedback.textContent = ''
  field.feedback.classList.add('hidden')
  field.feedback.removeAttribute('style')
  delete field.feedback.dataset['state']
  field.input.classList.remove('error')
  field.input.setAttribute('aria-invalid', 'false')
}

const setOpacity = (label: HTMLLabelElement, hasText: boolean): void => {
  label.style.opacity = hasText ? '0' : '0.5'
}

export interface LabelController {
  sync(): void
}

export const initLabelHandlers = (fields: ContactFormFields): LabelController => {
  const updateLabel = (
    input: HTMLInputElement | HTMLTextAreaElement,
    label: HTMLLabelElement
  ): void => {
    setOpacity(label, !!input.value.trim())
  }

  Object.values(fields).forEach(field => {
    field.input.addEventListener('input', () => updateLabel(field.input, field.label))
    updateLabel(field.input, field.label)
  })

  return {
    sync() {
      Object.values(fields).forEach(field => updateLabel(field.input, field.label))
    },
  }
}
