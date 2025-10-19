/**
 * Error handlers for client-side script
 * These are only used in development mode. In production, Sentry handles errors.
 */
import { logger } from '@lib/logger'
import { ClientScriptError } from './ClientScriptError'

/**
 * Unhandled exception handler
 */
export const unhandledExceptionHandler = (error: ErrorEvent): true => {
  const scriptError = new ClientScriptError(error)
  logger.error('Unhandled exception:', {
    message: scriptError.message,
    stack: scriptError.stack,
    fileName: scriptError.fileName,
    lineNumber: scriptError.lineNumber,
    columnNumber: scriptError.columnNumber,
  })
  /** Prevent the firing of the default event handler */
  return true
}

/**
 * Unhandled rejection handler
 */
export const unhandledRejectionHandler = ({ reason }: PromiseRejectionEvent): true => {
  const scriptError = new ClientScriptError(reason)
  logger.error('Unhandled promise rejection:', {
    message: scriptError.message,
    stack: scriptError.stack,
    fileName: scriptError.fileName,
    lineNumber: scriptError.lineNumber,
    columnNumber: scriptError.columnNumber,
  })
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
