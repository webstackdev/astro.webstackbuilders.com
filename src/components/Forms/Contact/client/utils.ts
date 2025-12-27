import type { ContactFormConfig, ContactFormElements } from './@types'

const WARNING_COLOR = 'var(--color-warning)'
const ERROR_COLOR = 'var(--color-danger)'
const DEFAULT_COLOR = 'var(--color-text-offset)'

export const initCharacterCounter = (
  elements: ContactFormElements,
  config: ContactFormConfig
): void => {
  elements.messageTextarea.addEventListener('input', () => {
    const count = elements.messageTextarea.value.length
    elements.charCount.textContent = count.toString()

    if (count > config.errorThreshold) {
      elements.charCount.style.color = ERROR_COLOR
    } else if (count > config.warningThreshold) {
      elements.charCount.style.color = WARNING_COLOR
    } else {
      elements.charCount.style.color = DEFAULT_COLOR
    }
  })
}

export const initUploadPlaceholder = (elements: ContactFormElements): void => {
  if (!elements.uppyContainer) {
    return
  }

  elements.uppyContainer.hidden = false
}
