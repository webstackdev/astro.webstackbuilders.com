/**
 * Centralized error handler
 * This is the SINGLE LOCATION for all error handling logic
 *
 * In development: Logs to console with detailed context
 * In production: Sends to Sentry (when integrated)
 *
 * Usage:
 * ```typescript
 * import { handleError } from '@lib/errors/errorHandler'
 *
 * try {
 *   // risky operation
 * } catch (error) {
 *   handleError(error, {
 *     component: 'DownloadForm',
 *     action: 'submit',
 *     userId: user.id
 *   })
 * }
 * ```
 */

import { ClientScriptError } from './ClientScriptError'
import type { ErrorContext } from './ClientScriptError'

// Re-export for convenience
export { ClientScriptError }
export type { ErrorContext }

const isProd = import.meta.env.PROD

/**
 * Central error handling function
 * This is the ONLY place where we call Sentry.captureException or console.error
 *
 * @param error - The error object (Error, string, or unknown)
 * @param context - Additional context about where/why the error occurred
 */
export function handleError(error: unknown, context?: ErrorContext): void {
  // Normalize error to get message
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  if (isProd) {
    // Production: Send to Sentry
    // Import Sentry dynamically to avoid bundling in dev
    import('@sentry/browser').then((Sentry) => {
      // Set context if provided
      if (context) {
        Sentry.setContext('error_context', context)
      }
      Sentry.captureException(error)
    }).catch(() => {
      // Fallback if Sentry fails to load
      console.error('[Sentry Error - Fallback]', errorMessage, context)
    })
  } else {
    // Development: Detailed console output
    console.group('❌ Error Occurred')
    console.error('Message:', errorMessage)
    if (errorStack) {
      console.error('Stack:', errorStack)
    }
    if (context) {
      console.error('Context:', context)
    }
    console.groupEnd()
  }
}

/**
 * Handle errors from async operations
 * Wraps handleError with async/await support
 */
export async function handleAsyncError(
  error: unknown,
  context?: ErrorContext
): Promise<void> {
  handleError(error, context)
}

/**
 * Create a wrapper function that automatically handles errors
 * Useful for event handlers and callbacks
 */
export function withErrorHandling<T extends (..._args: unknown[]) => unknown>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args)
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: unknown) => {
          handleError(error, context)
          throw error // Re-throw so caller can handle if needed
        })
      }
      return result
    } catch (error) {
      handleError(error, context)
      throw error // Re-throw so caller can handle if needed
    }
  }) as T
}
