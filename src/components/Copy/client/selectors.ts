/**
 * Type-safe DOM selectors for the Copy component.
 */
import { ClientScriptError } from '@components/scripts/errors'
import { isButtonElement, isSpanElement } from '@components/scripts/assertions/elements'

export const SELECTORS = {
  wrapper: '[data-copy-to-clipboard-wrapper]',
  content: '[data-copy-to-clipboard-content]',
  button: '[data-copy-to-clipboard-button]',
  icon: '[data-copy-to-clipboard-icon]',
  successIcon: '[data-copy-to-clipboard-success-icon]',
}

export const getCopyToClipboardWrapper = (root: ParentNode): HTMLSpanElement => {
  const wrapper = root.querySelector(SELECTORS.wrapper)
  if (!isSpanElement(wrapper)) {
    throw new ClientScriptError({
      message: `CopyToClipboard: wrapper element is missing, selector: ${SELECTORS.wrapper}`,
    })
  }
  return wrapper
}

export const getCopyToClipboardContent = (root: ParentNode): HTMLSpanElement => {
  const content = root.querySelector(SELECTORS.content)
  if (!isSpanElement(content)) {
    throw new ClientScriptError({
      message: `CopyToClipboard: content element is missing, selector: ${SELECTORS.content}`,
    })
  }
  return content
}

export const getCopyToClipboardButton = (root: ParentNode): HTMLButtonElement => {
  const button = root.querySelector(SELECTORS.button)
  if (!isButtonElement(button)) {
    throw new ClientScriptError({
      message: `CopyToClipboard: button element is missing, selector: ${SELECTORS.button}`,
    })
  }
  return button
}

export const getCopyToClipboardIcon = (root: ParentNode): HTMLSpanElement => {
  const icon = root.querySelector(SELECTORS.icon)
  if (!isSpanElement(icon)) {
    throw new ClientScriptError({
      message: `CopyToClipboard: icon element is missing, selector: ${SELECTORS.icon}`,
    })
  }
  return icon
}

export const getCopyToClipboardSuccessIcon = (root: ParentNode): HTMLSpanElement => {
  const successIcon = root.querySelector(SELECTORS.successIcon)
  if (!isSpanElement(successIcon)) {
    throw new ClientScriptError({
      message: `CopyToClipboard: success icon element is missing, selector: ${SELECTORS.successIcon}`,
    })
  }
  return successIcon
}
