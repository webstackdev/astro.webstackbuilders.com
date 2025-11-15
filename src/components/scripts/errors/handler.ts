import { captureException } from '@sentry/browser'
import { ClientScriptError } from './ClientScriptError'

export interface ScriptErrorContext {
  scriptName: string
  operation?: string
}

/**
 * Error boundary for non-fatal script execution exceptions
 *
 * Transforms any error into a ClientScriptError, logs in development,
 * and reports to Sentry in production (via beforeSend filter).
 *
 * @param error - The caught error (any type)
 * @param context - Script name and optional operation context
 * @returns Transformed ClientScriptError instance
 *
 * @example
 * ```typescript
 * try {
 *   script.init()
 * } catch (error) {
 *   handleScriptError(error, { scriptName: script.scriptName, operation: 'init' })
 * }
 * ```
 */
export function handleScriptError(
  error: unknown,
  context: ScriptErrorContext,
): ClientScriptError {
  // Transform to ClientScriptError (normalizes message internally)
  const clientError = new ClientScriptError(error)
  if (import.meta.env.PROD) {
    captureException(clientError, {
      tags: {
        scriptName: context.scriptName,
        ...(context.operation && { operation: context.operation }),
      },
    })
  } else {
    // Log it for debugging
    console.error(
      `[${context.scriptName}]${context.operation ? ` ${context.operation}` : ''}:`,
      clientError,
    )
  }
  return clientError
}
