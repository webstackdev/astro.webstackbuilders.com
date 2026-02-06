import { isFormElement, isInputElement, isUlElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  form: '[data-search-form]',
  input: '[data-search-input]',
  resultsContainer: '[data-search-results]',
  resultsList: '[data-search-results-list]',
} as const

export const OPTIONAL_SELECTORS = {
  toggleBtn: '[data-search-toggle]',
  panel: '[data-search-panel]',
  micBtn: '[data-search-mic]',
  clearBtn: '[data-search-clear]',
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

export function getSearchBarOptionalElements(context: Element) {
  const toggleBtn = context.querySelector(OPTIONAL_SELECTORS.toggleBtn)
  const panel = context.querySelector(OPTIONAL_SELECTORS.panel)
  const micBtn = context.querySelector(OPTIONAL_SELECTORS.micBtn)
  const clearBtn = context.querySelector(OPTIONAL_SELECTORS.clearBtn)

  return {
    toggleBtn: toggleBtn instanceof HTMLButtonElement ? toggleBtn : null,
    panel: panel instanceof HTMLElement ? panel : null,
    micBtn: micBtn instanceof HTMLButtonElement ? micBtn : null,
    clearBtn: clearBtn instanceof HTMLButtonElement ? clearBtn : null,
  }
}
