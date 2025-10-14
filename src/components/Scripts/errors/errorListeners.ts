/**
 * Error and exception handlers for site script.
 */
import { unhandledExceptionHandler, unhandledRejectionHandler } from './handlers'

/**
 * The `error` event is fired on a Window object when a resource failed to load or couldn't be used — for example if a script has an execution error. This event is not cancelable and does not bubble.
 */
export const addUnhandledExceptionEventListeners = () => {
  window.addEventListener('error', event => unhandledExceptionHandler(event))
}

/**
 * The `unhandledrejection` event is sent to the global scope of a script when a JavaScript Promise that has no rejection handler is rejected; typically, this is the window, but may also be a Worker.
 */
export const addUnhandledRejectionEventListeners = () => {
  window.addEventListener('unhandledrejection', event => unhandledRejectionHandler(event))
}

/**
 * Single entry point to call from `index.ts` for error event handlers
 */
export const addErrorEventListeners = () => {
  addUnhandledExceptionEventListeners()
  addUnhandledRejectionEventListeners()
}
