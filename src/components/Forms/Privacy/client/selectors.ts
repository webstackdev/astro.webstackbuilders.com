/**
 * Selectors for PrivacyForm component elements
 */
import { ClientScriptError } from '@components/scripts/errors'

type SelectorRoot = Document | DocumentFragment | Element

type OptionalSelectorRoot = SelectorRoot | undefined

function resolveRoot(root?: OptionalSelectorRoot): SelectorRoot {
  return root ?? document
}

function queryRequiredElement<TElement extends Element>(
  selector: string,
  guard: (_element: Element) => _element is TElement,
  errorMessage: string,
  root?: OptionalSelectorRoot
): TElement {
  const element = resolveRoot(root).querySelector(selector)
  if (!element || !guard(element)) {
    throw new ClientScriptError({
      message: errorMessage,
    })
  }
  return element
}

const isHtmlElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

export interface PrivacyFormElements {
  statusMessage: HTMLElement | undefined

  accessForm: HTMLFormElement
  accessEmailInput: HTMLInputElement
  accessMessage: HTMLElement

  deleteForm: HTMLFormElement
  deleteEmailInput: HTMLInputElement
  deleteConfirmCheckbox: HTMLInputElement
  deleteMessage: HTMLElement
}

export function getPrivacyFormElements(root?: SelectorRoot): PrivacyFormElements {
  const resolvedRoot = resolveRoot(root)
  const maybeStatus = resolvedRoot.querySelector('#status-message')

  return {
    statusMessage: maybeStatus instanceof HTMLElement ? maybeStatus : undefined,

    accessForm: queryRequiredElement(
      '#access-form',
      (el): el is HTMLFormElement => el instanceof HTMLFormElement,
      'Privacy access form not found',
      root
    ),
    accessEmailInput: queryRequiredElement(
      '#access-email',
      (el): el is HTMLInputElement => el instanceof HTMLInputElement,
      'Privacy access email input not found',
      root
    ),
    accessMessage: queryRequiredElement(
      '#access-message',
      isHtmlElement,
      'Privacy access message container not found',
      root
    ),

    deleteForm: queryRequiredElement(
      '#delete-form',
      (el): el is HTMLFormElement => el instanceof HTMLFormElement,
      'Privacy delete form not found',
      root
    ),
    deleteEmailInput: queryRequiredElement(
      '#delete-email',
      (el): el is HTMLInputElement => el instanceof HTMLInputElement,
      'Privacy delete email input not found',
      root
    ),
    deleteConfirmCheckbox: queryRequiredElement(
      '#confirm-delete',
      (el): el is HTMLInputElement => el instanceof HTMLInputElement,
      'Privacy delete confirmation checkbox not found',
      root
    ),
    deleteMessage: queryRequiredElement(
      '#delete-message',
      isHtmlElement,
      'Privacy delete message container not found',
      root
    ),
  }
}
