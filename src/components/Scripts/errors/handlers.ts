/**
 * Error handlers for client-side script
 */
import { ClientScriptError } from './ClientScriptError'
import { logError } from './logger'
/**
 * Unhandled exception handler
 */
export const unhandledExceptionHandler = (error: ErrorEvent): true => {
  logError(new ClientScriptError(error))
  /** Prevent the firing of the default event handler */
  return true
}

/**
 * Unhandled rejection handler
 */
export const unhandledRejectionHandler = ({ reason }: PromiseRejectionEvent): true => {
  logError(new ClientScriptError(reason))
  /** Prevent the firing of the default event handler */
  return true
}

/**
 * Error handler for use in .catch() clause on promises
 */
// (reason: any) => PromiseLike<never>
export const promiseErrorHandler = (reason: unknown) => {
  throw new ClientScriptError(reason)
}
