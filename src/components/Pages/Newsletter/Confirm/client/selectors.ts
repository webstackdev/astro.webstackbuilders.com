/**
 * Selectors for NewsletterConfirm component elements
 */
import { ClientScriptError } from '@components/scripts/errors'

type SelectorRoot = Document | DocumentFragment | Element

function resolveRoot(root?: SelectorRoot): SelectorRoot {
  return root ?? document
}

function queryRequiredElement<TElement extends Element>(
  selector: string,
  guard: (_element: Element) => _element is TElement,
  errorMessage: string,
  root?: SelectorRoot
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

export interface NewsletterConfirmElements {
  loadingState: HTMLDivElement
  successState: HTMLDivElement
  expiredState: HTMLDivElement
  errorState: HTMLDivElement
  statusAnnouncer: HTMLElement
  userEmail: HTMLElement
  errorTitle: HTMLElement
  errorMessage: HTMLElement
  errorDetails: HTMLElement
  successHeading: HTMLElement
  expiredHeading: HTMLElement
  loadingHeading: HTMLElement
}

export function getNewsletterConfirmElements(root?: SelectorRoot): NewsletterConfirmElements {
  return {
    loadingState: queryRequiredElement(
      '#loading-state',
      (el): el is HTMLDivElement => el instanceof HTMLDivElement,
      'Newsletter confirm loading state not found',
      root
    ),
    successState: queryRequiredElement(
      '#success-state',
      (el): el is HTMLDivElement => el instanceof HTMLDivElement,
      'Newsletter confirm success state not found',
      root
    ),
    expiredState: queryRequiredElement(
      '#expired-state',
      (el): el is HTMLDivElement => el instanceof HTMLDivElement,
      'Newsletter confirm expired state not found',
      root
    ),
    errorState: queryRequiredElement(
      '#error-state',
      (el): el is HTMLDivElement => el instanceof HTMLDivElement,
      'Newsletter confirm error state not found',
      root
    ),
    statusAnnouncer: queryRequiredElement(
      '#confirmation-status',
      isHtmlElement,
      'Newsletter confirm status announcer not found',
      root
    ),
    userEmail: queryRequiredElement('#user-email', isHtmlElement, 'Newsletter confirm email not found', root),
    errorTitle: queryRequiredElement('#error-title', isHtmlElement, 'Newsletter confirm error title not found', root),
    errorMessage: queryRequiredElement(
      '#error-message',
      isHtmlElement,
      'Newsletter confirm error message not found',
      root
    ),
    errorDetails: queryRequiredElement(
      '#error-details',
      isHtmlElement,
      'Newsletter confirm error details not found',
      root
    ),
    successHeading: queryRequiredElement(
      '#confirm-heading-success',
      isHtmlElement,
      'Newsletter confirm success heading not found',
      root
    ),
    expiredHeading: queryRequiredElement(
      '#confirm-heading-expired',
      isHtmlElement,
      'Newsletter confirm expired heading not found',
      root
    ),
    loadingHeading: queryRequiredElement(
      '#confirm-heading-loading',
      isHtmlElement,
      'Newsletter confirm loading heading not found',
      root
    ),
  }
}
