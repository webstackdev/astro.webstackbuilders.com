import {
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
  const micBtn = context.querySelector(SELECTORS.micBtn)
  const clearBtn = context.querySelector(SELECTORS.clearBtn)
  const form = context.querySelector(SELECTORS.form)
  const input = context.querySelector(SELECTORS.input)

  return {
    form: form instanceof HTMLFormElement ? form : null,
    meta,
    error,
    resultsList,
    emptyState: isDivElement(emptyState) ? emptyState : null,
    input: isInputElement(input) ? input : null,
    micBtn: micBtn instanceof HTMLButtonElement ? micBtn : null,
    clearBtn: clearBtn instanceof HTMLButtonElement ? clearBtn : null,
  }
}
