import {
  isButtonElement,
  isDivElement,
  isSpanElement,
} from '@components/scripts/assertions/elements'

export const SELECTORS = {
  closeButton: '[data-image-close]',
  modalRoot: '[data-image-modal-root]',
} as const

export const getImageModalRoot = (context: Element): HTMLDivElement | null => {
  const candidate = context.querySelector(SELECTORS.modalRoot)
  return isDivElement(candidate) ? candidate : null
}

export const queryImageCloseButton = (root: ParentNode): HTMLButtonElement | null => {
  const candidate = root.querySelector(SELECTORS.closeButton)
  return isButtonElement(candidate) ? candidate : null
}

export const queryImageIconMarkup = (params: {
  iconBankId: string
  iconName: 'close'
  root?: Document
}): string | null => {
  const { iconBankId, iconName, root = document } = params

  if (!iconBankId || !iconName) {
    return null
  }

  const iconBankCandidate = root.getElementById(iconBankId)
  if (!isDivElement(iconBankCandidate)) {
    return null
  }

  const iconHostCandidate = iconBankCandidate.querySelector(`[data-image-icon="${iconName}"]`)
  if (!isSpanElement(iconHostCandidate)) {
    return null
  }

  const markup = iconHostCandidate.innerHTML.trim()
  return markup ? markup : null
}
