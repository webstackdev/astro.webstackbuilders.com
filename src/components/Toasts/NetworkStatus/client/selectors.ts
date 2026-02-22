import {
  isDivElement,
  isSpanElement,
  isType1Element,
} from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  toast: '[data-network-status-toast]',
  message: '.toast-message',
  connectionStatusIndicator: '.connection-status',
} as const

/**
 * Get NetworkStatus toast elements with type validation.
 */
export function getNetworkStatusToastElements(context: Element) {
  const toast = context.querySelector(SELECTORS.toast)
  if (!isDivElement(toast)) {
    throw new ClientScriptError({
      scriptName: 'NetworkStatusToastElement',
      operation: 'getNetworkStatusToastElements',
      message: 'Network status toast root element not found',
    })
  }

  const message = context.querySelector(SELECTORS.message)
  if (!isSpanElement(message)) {
    throw new ClientScriptError({
      scriptName: 'NetworkStatusToastElement',
      operation: 'getNetworkStatusToastElements',
      message: 'Network status toast message element not found',
    })
  }

  return {
    toast,
    message,
  }
}

/**
 * The connection status indicator is optional and lives outside the custom element.
 * Returns null when not present.
 */
export function queryConnectionStatusIndicator(root: ParentNode = document): HTMLElement | null {
  const candidate = root.querySelector(SELECTORS.connectionStatusIndicator)
  if (!candidate) {
    return null
  }

  if (!isType1Element(candidate) || !(candidate instanceof HTMLElement)) {
    return null
  }

  return candidate
}

export function queryNetworkStatusIconMarkup(params: {
  iconBankId: string
  iconName: 'success' | 'error'
  root?: Document
}): string | null {
  const { iconBankId, iconName, root = document } = params

  if (!iconBankId || !iconName) {
    return null
  }

  const iconBankCandidate = root.getElementById(iconBankId)
  if (!isDivElement(iconBankCandidate)) {
    return null
  }

  const iconHostCandidate = iconBankCandidate.querySelector(`[data-network-status-icon="${iconName}"]`)
  if (!isSpanElement(iconHostCandidate)) {
    return null
  }

  const markup = iconHostCandidate.innerHTML.trim()
  return markup ? markup : null
}
