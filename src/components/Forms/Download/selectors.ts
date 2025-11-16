/**
 * Selectors for DownloadForm component elements
 */
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'

/**
 * Get the download form element
 * @throws {Error} If form element is not found
 */
export function getDownloadFormElement(): HTMLFormElement {
  const form = document.getElementById('downloadForm')
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
export function getDownloadSubmitButton(): HTMLButtonElement {
  const button = document.getElementById('downloadSubmitBtn')
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
export function getDownloadStatusDiv(): HTMLElement {
  const statusDiv = document.getElementById('downloadFormStatus')
  if (!statusDiv) {
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
export function getDownloadButtonWrapper(): HTMLElement {
  const wrapper = document.getElementById('downloadButtonWrapper')
  if (!wrapper) {
    throw new ClientScriptError({
      message: `Download button wrapper not found`
    })
  }
  return wrapper
}
