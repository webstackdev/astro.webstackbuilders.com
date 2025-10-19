/**
 * Error handling module
 * Centralized error handling and custom error classes
 */

export { ClientScriptError } from './ClientScriptError'
export { handleError, handleAsyncError, withErrorHandling } from './errorHandler'
export type { ErrorContext } from './ClientScriptError'
