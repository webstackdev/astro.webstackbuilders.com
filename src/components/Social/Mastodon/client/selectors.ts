import { isDivElement, isInputElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  modal: '[role="dialog"]',
  instanceInput: '#mastodon-instance',
} as const

export const getMastodonModalElement = (context: Element, modalId: string): HTMLDivElement => {
  const modal = context.querySelector(SELECTORS.modal)
  if (!isDivElement(modal)) {
    throw new ClientScriptError({
      scriptName: 'MastodonModalElement',
      operation: 'getMastodonModalElement',
      message: 'Mastodon modal root element not found',
    })
  }

  if (modal.id !== modalId) {
    throw new ClientScriptError({
      scriptName: 'MastodonModalElement',
      operation: 'getMastodonModalElement',
      message: `Mastodon modal id does not match modalId (expected ${modalId}, found ${modal.id})`,
    })
  }

  return modal
}

export const queryMastodonInstanceInput = (context: Element): HTMLInputElement | null => {
  const input = context.querySelector(SELECTORS.instanceInput)
  if (!input) {
    return null
  }

  return isInputElement(input) ? input : null
}
