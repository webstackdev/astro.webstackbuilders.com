/**
 * Selectors for DownloadForm component elements
 */
import { ClientScriptError } from '@components/scripts/errors'

type SelectorRoot = Document | DocumentFragment | Element

function resolveRoot(root?: SelectorRoot): SelectorRoot {
  return root ?? document
}

function queryInputElement(
  selector: string,
  errorMessage: string,
  root?: SelectorRoot
): HTMLInputElement {
  const element = resolveRoot(root).querySelector(selector)
  if (!element || !(element instanceof HTMLInputElement)) {
    throw new ClientScriptError({
      message: errorMessage
    })
  }
  return element
}

/**
 * Get the download form element
 * @throws {Error} If form element is not found
 */
export function getDownloadFormElement(root?: SelectorRoot): HTMLFormElement {
  const form = resolveRoot(root).querySelector('#downloadForm')
  if (!form || !(form instanceof HTMLFormElement)) {
    throw new ClientScriptError({
      message: `Download form element not found`
    })
  }
  return form
}

/**
 * Get the download form submit button
 * @throws {Error} If submit button is not found
 */
export function getDownloadSubmitButton(root?: SelectorRoot): HTMLButtonElement {
  const button = resolveRoot(root).querySelector('#downloadSubmitBtn')
  if (!button || !(button instanceof HTMLButtonElement)) {
    throw new ClientScriptError({
      message: `Download submit button not found`
    })
  }
  return button
}

/**
 * Get the download form status div
 * @throws {Error} If status div is not found
 */
export function getDownloadStatusDiv(root?: SelectorRoot): HTMLElement {
  const statusDiv = resolveRoot(root).querySelector('#downloadFormStatus')
  if (!statusDiv || !(statusDiv instanceof HTMLElement)) {
    throw new ClientScriptError({
      message: `Download status div not found`
    })
  }
  return statusDiv
}

/**
 * Get the download button wrapper
 * @throws {Error} If download button wrapper is not found
 */
export function getDownloadButtonWrapper(root?: SelectorRoot): HTMLElement {
  const wrapper = resolveRoot(root).querySelector('#downloadButtonWrapper')
  if (!wrapper || !(wrapper instanceof HTMLElement)) {
    throw new ClientScriptError({
      message: `Download button wrapper not found`
    })
  }
  return wrapper
}

export function getDownloadFirstNameInput(root?: SelectorRoot): HTMLInputElement {
  return queryInputElement('#firstName', 'First name input not found', root)
}

export function getDownloadLastNameInput(root?: SelectorRoot): HTMLInputElement {
  return queryInputElement('#lastName', 'Last name input not found', root)
}

export function getDownloadWorkEmailInput(root?: SelectorRoot): HTMLInputElement {
  return queryInputElement('#workEmail', 'Work email input not found', root)
}

export function getDownloadJobTitleInput(root?: SelectorRoot): HTMLInputElement {
  return queryInputElement('#jobTitle', 'Job title input not found', root)
}

export function getDownloadCompanyNameInput(root?: SelectorRoot): HTMLInputElement {
  return queryInputElement('#companyName', 'Company name input not found', root)
}
