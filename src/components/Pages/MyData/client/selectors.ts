/**
 * Selectors for PrivacyForm component elements
 */
import { isButtonElement } from '@components/scripts/assertions/elements'
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

type RequestType = 'ACCESS' | 'DELETE'
type RequestPreviewState = 'loading' | 'success' | 'error' | 'validation'

const previewToastStates: RequestPreviewState[] = ['success', 'loading', 'error', 'validation']

const getPreviewToastSelector = (
  requestType: RequestType,
  previewState: RequestPreviewState
): string => {
  const prefix = requestType === 'ACCESS' ? 'access' : 'delete'
  return `#${prefix}-preview-toast-${previewState}`
}

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

export function getPrivacyPreviewToastElements(
  requestType: RequestType,
  root?: SelectorRoot
): HTMLElement[] {
  const resolvedRoot = resolveRoot(root)

  return previewToastStates
    .map(previewState =>
      resolvedRoot.querySelector(getPreviewToastSelector(requestType, previewState))
    )
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
}

export function getPrivacyPreviewToastElement(
  requestType: RequestType,
  previewState: RequestPreviewState,
  root?: SelectorRoot
): HTMLElement | undefined {
  const element = resolveRoot(root).querySelector(
    getPreviewToastSelector(requestType, previewState)
  )
  return element instanceof HTMLElement ? element : undefined
}

export function getPrivacySubmitButton(form: HTMLFormElement): HTMLButtonElement | undefined {
  const button = form.querySelector('button[type="submit"]')
  return isButtonElement(button) ? button : undefined
}
