/**
 * Utilities for use in Jest setup script `beforeEach` and similar functions
 */
import { getState, type removalCb } from './state'

/**
 * Remove tracked global listeners from both state and the DOM
 */
export const removeTrackedGlobalEventListeners = () => {
  const removeWindowEventListenerCb: removalCb = ({ type, listener, options }) => {
    globalThis['window'].removeEventListener(type, listener, options)
  }

  const removeDocumentEventListenerCb: removalCb = ({ type, listener, options }) => {
    globalThis['document'].removeEventListener(type, listener, options)
  }

  getState().resetEventListenerTracking([
    removeWindowEventListenerCb,
    removeDocumentEventListenerCb,
  ])
}

/**
 * Remove any added keys to the global JSDOM Windows and Document objects
 */
export const removeGlobalProperties = () => {
  getState().nodeNames.forEach(nodeName => {
    Object.keys(globalThis[nodeName])
      .filter(getState().filterTrackedGlobalProperties(nodeName))
      .forEach(property => {
        try {
          // @ts-ignore no index signature of type 'string' on global
          delete globalThis[nodeName][property]
        } catch (err: unknown) {
          if (err instanceof TypeError) {
            throw new Error(
              `Attempted to remove property '${property}' but it is an own non-configurable property`
            )
          }
          throw err
        }

      })
  })
}

/** Remove attributes on root element */
export const removeRootAttributes = (rootElement: HTMLElement) => {
  Array.from(rootElement.attributes).forEach(attr => rootElement.removeAttribute(attr.name))
}

/** Remove elements (faster than setting innerHTML) */
export const removeRootChildElements = (rootElement: HTMLElement) => {
  while (rootElement.firstChild) {
    rootElement.removeChild(rootElement.firstChild)
  }
}

/** Restore base HTML page elements **/
export const restoreRootBaseElements = (rootElement: HTMLElement) => {
  rootElement.innerHTML = '<head></head><body></body>'
}
