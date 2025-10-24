/**
 * Error handlers for client-side script
 * These are only used in development mode. In production, Sentry handles errors.
 */
import { logger } from '@lib/logger'
import { ClientScriptError } from './ClientScriptError'

declare global {
  interface Window {
    _error?: Array<ClientScriptError>
    _isError: boolean
  }
}

/**
 * Unhandled exception handler
 */
export const unhandledExceptionHandler = (error: ErrorEvent): true => {
  const scriptError = new ClientScriptError(error)
  window._isError = true
  if (window._error) {
    window._error.push(scriptError)
  } else {
    window._error = [scriptError]
  }
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
  window._isError = true
  if (window._error) {
    window._error.push(scriptError)
  } else {
    window._error = [scriptError]
  }
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
