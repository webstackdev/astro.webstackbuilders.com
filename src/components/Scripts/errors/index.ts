import { addBreadcrumb, captureException } from '@sentry/browser'
import { ClientScriptError } from './ClientScriptError'

export interface ScriptErrorContext {
  scriptName: string
  operation?: string
}

/**
 * Error boundary for script execution errors for non-fatal exceptions
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

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error(
      `[${context.scriptName}]${context.operation ? ` ${context.operation}` : ''}:`,
      clientError,
    )
  }

  // Report to Sentry (beforeSend filters in dev automatically)
  captureException(clientError, {
    tags: {
      scriptName: context.scriptName,
      ...(context.operation && { operation: context.operation }),
    },
  })

  return clientError
}

/**
 * Add a breadcrumb before attempting a script operation or Sentry tracking
 *
 * @param context - Script name and operation context
 *
 * @example
 * ```typescript
 * addScriptBreadcrumb({ scriptName: 'ComponentName', operation: 'functionName' })
 * try {
 *   script.init()
 * } catch (error) {
 *   handleScriptError(error, { scriptName: 'ComponentName', operation: 'functionName' })
 * }
 * ```
 */
export function addScriptBreadcrumb(context: ScriptErrorContext): void {
  addBreadcrumb({
    category: 'script',
    message: `${context.operation || 'Executing'} ${context.scriptName}`,
    level: 'info',
  })
}

// Re-export ClientScriptError for convenience
export { ClientScriptError } from './ClientScriptError'
