import { addBreadcrumb } from '@sentry/browser'

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
