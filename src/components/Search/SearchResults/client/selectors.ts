import {
  isFormElement,
  isDivElement,
  isInputElement,
  isOrderedListElement,
  isParagraphElement,
} from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  form: '[data-search-form]',
  meta: '[data-search-meta]',
  error: '[data-search-error]',
  resultsList: 'ol[data-search-results]',
  emptyState: '[data-search-empty-state]',
  input: '[data-search-input]',
  micBtn: '[data-search-mic]',
  clearBtn: '[data-search-clear]',
} as const

/**
 * Get search results elements with type validation
 */
export function getSearchResultsElements(context: Element) {
  const form = context.querySelector(SELECTORS.form)
  if (!isFormElement(form)) {
    throw new ClientScriptError({
      scriptName: 'SearchResultsElement',
      operation: 'getSearchResultsElements',
      message: 'Search form element not found',
    })
  }

  const meta = context.querySelector(SELECTORS.meta)
  if (!isParagraphElement(meta)) {
    throw new ClientScriptError({
      scriptName: 'SearchResultsElement',
      operation: 'getSearchResultsElements',
      message: 'Search meta paragraph element not found',
    })
  }

  const error = context.querySelector(SELECTORS.error)
  if (!isParagraphElement(error)) {
    throw new ClientScriptError({
      scriptName: 'SearchResultsElement',
      operation: 'getSearchResultsElements',
      message: 'Search error paragraph element not found',
    })
  }

  const resultsList = context.querySelector(SELECTORS.resultsList)
  if (!isOrderedListElement(resultsList)) {
    throw new ClientScriptError({
      scriptName: 'SearchResultsElement',
      operation: 'getSearchResultsElements',
      message: 'Search results list element not found',
    })
  }

  const emptyState = context.querySelector(SELECTORS.emptyState)
  if (!isDivElement(emptyState)) {
    throw new ClientScriptError({
      scriptName: 'SearchResultsElement',
      operation: 'getSearchResultsElements',
      message: 'Search empty state element not found',
    })
  }

  const input = context.querySelector(SELECTORS.input)
  if (!isInputElement(input)) {
    throw new ClientScriptError({
      scriptName: 'SearchResultsElement',
      operation: 'getSearchResultsElements',
      message: 'Search input element not found',
    })
  }

  const micBtn = context.querySelector(SELECTORS.micBtn)
  if (!(micBtn instanceof HTMLButtonElement)) {
    throw new ClientScriptError({
      scriptName: 'SearchResultsElement',
      operation: 'getSearchResultsElements',
      message: 'Search microphone button element not found',
    })
  }

  const clearBtn = context.querySelector(SELECTORS.clearBtn)
  if (!(clearBtn instanceof HTMLButtonElement)) {
    throw new ClientScriptError({
      scriptName: 'SearchResultsElement',
      operation: 'getSearchResultsElements',
      message: 'Search clear button element not found',
    })
  }

  return {
    form,
    meta,
    error,
    resultsList,
    emptyState,
    input,
    micBtn,
    clearBtn,
  }
}
