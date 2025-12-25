import { isInputElement, isOrderedListElement, isParagraphElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  meta: '[data-search-meta]',
  error: '[data-search-error]',
  resultsList: 'ol[data-search-results]',
  input: 'search-bar [data-search-input]',
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

  const input = context.querySelector(SELECTORS.input)
  if (!isInputElement(input)) {
    throw new ClientScriptError({
      scriptName: 'SearchResultsElement',
      operation: 'getSearchResultsElements',
      message: 'Search input element not found',
    })
  }

  return {
    meta,
    error,
    resultsList,
    input,
  }
}
