import { isFormElement, isInputElement, isUlElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  form: '[data-search-form]',
  input: '[data-search-input]',
  resultsContainer: '[data-search-results]',
  resultsList: '[data-search-results-list]',
} as const

/**
 * Get search bar elements with type validation
 */
export function getSearchBarElements(context: Element) {
  const form = context.querySelector(SELECTORS.form)
  if (!isFormElement(form)) {
    throw new ClientScriptError({
      scriptName: 'SearchBarElement',
      operation: 'getSearchBarElements',
      message: 'Search form element not found',
    })
  }

  const input = context.querySelector(SELECTORS.input)
  if (!isInputElement(input)) {
    throw new ClientScriptError({
      scriptName: 'SearchBarElement',
      operation: 'getSearchBarElements',
      message: 'Search input element not found',
    })
  }

  const resultsContainer = context.querySelector(SELECTORS.resultsContainer)
  if (!(resultsContainer instanceof HTMLElement)) {
    throw new ClientScriptError({
      scriptName: 'SearchBarElement',
      operation: 'getSearchBarElements',
      message: 'Search results container element not found',
    })
  }

  const resultsList = context.querySelector(SELECTORS.resultsList)
  if (!isUlElement(resultsList)) {
    throw new ClientScriptError({
      scriptName: 'SearchBarElement',
      operation: 'getSearchBarElements',
      message: 'Search results list element not found',
    })
  }

  return {
    form,
    input,
    resultsContainer,
    resultsList,
  }
}
