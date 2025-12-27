import { ActionError, type ActionErrorCode } from 'astro:actions'
import { captureException, withScope } from '@sentry/astro'
import { ensureActionSentry } from '@actions/utils/sentry'
import { isDev, isProd, isTest, isUnitTest } from '@actions/utils/environment/environmentActions'
import { ActionsFunctionError, type ActionsFunctionErrorParams } from './ActionsFunctionError'

ensureActionSentry()

export interface ActionsFunctionContext {
  route: string
  operation?: string
  requestId?: string
  correlationId?: string
  runtime?: 'node' | 'edge'
  region?: string
  status?: number
  code?: string
  extra?: Record<string, unknown>
  scrub?: (_error: ActionsFunctionError) => void
}

export interface ActionsErrorLogEntry {
  level: 'error'
  timestamp: string
  route: string
  operation?: string | undefined
  status: number
  code?: string | undefined
  retryable: boolean
  requestId?: string | undefined
  correlationId?: string | undefined
  runtime?: string | undefined
  region?: string | undefined
  message: string
  stack?: string | undefined
  cause?: string | undefined
}

export interface ThrowActionErrorOptions {
  fallbackMessage?: string
}

/**
 * Serializes an arbitrary error cause into a short string for logging.
 * Prefers `Error.message` when available.
 */
const toCauseString = (cause: unknown): string | undefined => {
  if (!cause) return undefined
  if (cause instanceof Error) return cause.message
  return String(cause)
}

/**
 * Normalizes an unknown thrown value into an `ActionsFunctionError`, logs it, and
 * reports it to Sentry in production. This is the central entrypoint for server
 * action error handling.
 */
export function handleActionsFunctionError(
  error: unknown,
  context: ActionsFunctionContext
): ActionsFunctionError {
  const overrides: Partial<ActionsFunctionErrorParams> = {
    route: context.route,
  }

  if (context.operation !== undefined) overrides.operation = context.operation
  if (context.requestId !== undefined) overrides.requestId = context.requestId
  if (context.correlationId !== undefined) overrides.correlationId = context.correlationId
  if (context.status !== undefined) overrides.status = context.status
  if (context.code !== undefined) overrides.appCode = context.code

  const normalizedError = ActionsFunctionError.from(error, overrides)

  if (context.scrub) {
    context.scrub(normalizedError)
  }

  logActionsError(normalizedError, context)

  if (isProd()) {
    withScope(scope => {
      scope.setTags({
        route: context.route,
        status: String(normalizedError.status),
        retryable: normalizedError.retryable ? 'true' : 'false',
        ...(context.operation && { operation: context.operation }),
        ...(context.runtime && { runtime: context.runtime }),
        ...(context.region && { region: context.region }),
      })

      if (context.requestId) scope.setTag('requestId', context.requestId)
      if (context.correlationId) scope.setTag('correlationId', context.correlationId)

      if (context.extra && Object.keys(context.extra).length > 0) {
        scope.setExtras(context.extra)
      }

      captureException(normalizedError)
    })
  }

  return normalizedError
}

/**
 * Formats a stable JSON log entry for an `ActionsFunctionError`. In dev (non-unit-test)
 * it includes stack / cause details to speed up debugging.
 */
export function formatActionsErrorLogEntry(
  error: ActionsFunctionError,
  context: ActionsFunctionContext
): ActionsErrorLogEntry {
  const entry: ActionsErrorLogEntry = {
    level: 'error',
    timestamp: new Date().toISOString(),
    route: context.route,
    status: error.status,
    code: error.code,
    retryable: error.retryable,
    message: error.getSafeMessage(),
  }

  if (context.operation) entry.operation = context.operation
  if (context.runtime) entry.runtime = context.runtime
  if (context.region) entry.region = context.region
  if (context.requestId) entry.requestId = context.requestId
  if (context.correlationId) entry.correlationId = context.correlationId

  if (isDev() && !isUnitTest()) {
    if (error.stack) entry.stack = error.stack
    const causeText = toCauseString(error.cause)
    if (causeText) entry.cause = causeText
  }

  return entry
}

/**
 * Writes the formatted actions error JSON to stderr. No-ops during tests to keep output clean.
 */
function logActionsError(error: ActionsFunctionError, context: ActionsFunctionContext): void {
  if (isTest() || isUnitTest()) {
    return
  }

  const entry = formatActionsErrorLogEntry(error, context)
  console.error(JSON.stringify(entry))
}

const statusToCodeFallbackMap: Partial<Record<number, ActionErrorCode>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  406: 'NOT_ACCEPTABLE',
  407: 'PROXY_AUTHENTICATION_REQUIRED',
  408: 'REQUEST_TIMEOUT',
  409: 'CONFLICT',
  410: 'GONE',
  411: 'LENGTH_REQUIRED',
  412: 'PRECONDITION_FAILED',
  413: 'CONTENT_TOO_LARGE',
  414: 'URI_TOO_LONG',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  416: 'RANGE_NOT_SATISFIABLE',
  417: 'EXPECTATION_FAILED',
  421: 'MISDIRECTED_REQUEST',
  422: 'UNPROCESSABLE_CONTENT',
  423: 'LOCKED',
  424: 'FAILED_DEPENDENCY',
  425: 'TOO_EARLY',
  426: 'UPGRADE_REQUIRED',
  428: 'PRECONDITION_REQUIRED',
  429: 'TOO_MANY_REQUESTS',
  431: 'REQUEST_HEADER_FIELDS_TOO_LARGE',
  451: 'UNAVAILABLE_FOR_LEGAL_REASONS',
  500: 'INTERNAL_SERVER_ERROR',
  501: 'NOT_IMPLEMENTED',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
  505: 'HTTP_VERSION_NOT_SUPPORTED',
  506: 'VARIANT_ALSO_NEGOTIATES',
  507: 'INSUFFICIENT_STORAGE',
  508: 'LOOP_DETECTED',
  511: 'NETWORK_AUTHENTICATION_REQUIRED',
}

function statusToActionErrorCode(status: number): ActionErrorCode {
  const statusToCode = (
    ActionError as unknown as { statusToCode?: (_input: number) => ActionErrorCode }
  ).statusToCode
  if (statusToCode) return statusToCode(status)
  return statusToCodeFallbackMap[status] ?? 'INTERNAL_SERVER_ERROR'
}

/**
 * Converts an `ActionsFunctionError` into Astro's `ActionError`. The HTTP status is
 * mapped to an `ActionErrorCode`, and the message is scrubbed via `getSafeMessage()`.
 */
export function toActionError(
  error: ActionsFunctionError,
  options?: ThrowActionErrorOptions
): ActionError {
  const code = statusToActionErrorCode(error.status)
  const fallbackMessage = options?.fallbackMessage ?? 'Internal server error'

  return new ActionError({
    code,
    message: error.getSafeMessage(fallbackMessage),
  })
}

/**
 * Convenience helper: normalize / log / report an unknown error and throw an
 * `ActionError` for the client. Call this from `defineAction().handler` catch blocks.
 */
export function throwActionError(
  error: unknown,
  context: ActionsFunctionContext,
  options?: ThrowActionErrorOptions
): never {
  const normalized = handleActionsFunctionError(error, context)
  throw toActionError(normalized, options)
}
