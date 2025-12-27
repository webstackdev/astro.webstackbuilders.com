import { createHash } from 'node:crypto'
import { captureException, withScope } from '@sentry/astro'
import { ensureApiSentry } from '@pages/api/_utils/sentry'
import { isDev, isProd, isTest } from '@pages/api/_utils/environment'
import { ApiFunctionError, type ApiFunctionErrorParams } from './ApiFunctionError'

ensureApiSentry()

export interface ApiRequestMetadata {
  method?: string
  ip?: string
  ipHash?: string
  userAgent?: string
  userAgentHash?: string
}

export interface ApiFunctionConsent {
  functional?: boolean
}

export interface ApiFunctionContext {
  route: string
  operation?: string
  requestId?: string
  correlationId?: string
  runtime?: 'node' | 'edge'
  region?: string
  user?: {
    id?: string
    email?: string
  }
  status?: number
  code?: string
  extra?: Record<string, unknown>
  consent?: ApiFunctionConsent
  requestMeta?: ApiRequestMetadata
  hashSalt?: string
  scrub?: (_error: ApiFunctionError) => void
}

export interface ApiErrorResponseOptions {
  fallbackMessage?: string
  includeDetails?: boolean
  headers?: HeadersInit
}

export interface ApiErrorLogEntry {
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
  consentFunctional: boolean
  message: string
  stack?: string | undefined
  cause?: string | undefined
  requestMeta?: SanitizedRequestMetadata | undefined
}

interface SanitizedRequestMetadata {
  method?: string | undefined
  ipHash?: string | undefined
  uaHash?: string | undefined
}

export function handleApiFunctionError(
  error: unknown,
  context: ApiFunctionContext
): ApiFunctionError {
  const overrides: Partial<ApiFunctionErrorParams> = {
    route: context.route,
  }

  if (context.operation !== undefined) overrides.operation = context.operation
  if (context.requestId !== undefined) overrides.requestId = context.requestId
  if (context.correlationId !== undefined) overrides.correlationId = context.correlationId
  if (context.status !== undefined) overrides.status = context.status
  if (context.code !== undefined) overrides.code = context.code

  const serverError = ApiFunctionError.from(error, overrides)

  const hasFunctionalConsent = context.consent?.functional ?? false
  const hashSalt = context.hashSalt ?? context.route
  const sanitizedMetadata = sanitizeRequestMetadata(context.requestMeta, hashSalt)

  if (!hasFunctionalConsent) {
    serverError.details = undefined
  }

  if (context.scrub) {
    context.scrub(serverError)
  }

  logApiError(serverError, {
    route: context.route,
    operation: context.operation,
    runtime: context.runtime,
    region: context.region,
    consentFunctional: hasFunctionalConsent,
    requestId: context.requestId,
    correlationId: context.correlationId,
    requestMeta: sanitizedMetadata,
  })

  if (isProd() && !isTest()) {
    withScope(scope => {
      scope.setTags({
        route: context.route,
        status: String(serverError.status),
        retryable: serverError.retryable ? 'true' : 'false',
        consentFunctional: hasFunctionalConsent ? 'true' : 'false',
        ...(context.operation && { operation: context.operation }),
        ...(context.runtime && { runtime: context.runtime }),
        ...(context.region && { region: context.region }),
      })

      if (context.requestId) {
        scope.setTag('requestId', context.requestId)
      }

      if (context.correlationId) {
        scope.setTag('correlationId', context.correlationId)
      }

      const requestContext: Record<string, unknown> = {}
      if (sanitizedMetadata.method) requestContext['method'] = sanitizedMetadata.method
      if (sanitizedMetadata.ipHash) requestContext['ipHash'] = sanitizedMetadata.ipHash
      if (sanitizedMetadata.uaHash) requestContext['uaHash'] = sanitizedMetadata.uaHash
      if (Object.keys(requestContext).length > 0) {
        scope.setContext('request', requestContext)
      }

      if (context.user?.id || context.user?.email) {
        scope.setUser({
          ...(context.user.id && { id: context.user.id }),
          ...(context.user.email && { email: context.user.email }),
        })
      }

      if (context.extra && Object.keys(context.extra).length > 0) {
        scope.setExtras(context.extra)
      }

      captureException(serverError)
    })
  }

  return serverError
}

export function formatApiErrorLogEntry(
  error: ApiFunctionError,
  details: {
    route: string
    operation?: string | undefined
    runtime?: string | undefined
    region?: string | undefined
    consentFunctional: boolean
    requestId?: string | undefined
    correlationId?: string | undefined
    requestMeta?: SanitizedRequestMetadata | undefined
  }
): ApiErrorLogEntry {
  const entry: ApiErrorLogEntry = {
    level: 'error',
    timestamp: new Date().toISOString(),
    route: details.route,
    status: error.status,
    code: error.code,
    retryable: error.retryable,
    consentFunctional: details.consentFunctional,
    message: error.getSafeMessage(),
  }

  if (isDev()) {
    if (error.stack) entry.stack = error.stack
    if (error.cause)
      entry.cause = error.cause instanceof Error ? error.cause.message : String(error.cause)
  }

  if (details.operation) entry.operation = details.operation
  if (details.runtime) entry.runtime = details.runtime
  if (details.region) entry.region = details.region
  if (details.requestId) entry.requestId = details.requestId
  if (details.correlationId) entry.correlationId = details.correlationId
  if (details.requestMeta && Object.keys(details.requestMeta).length > 0) {
    entry.requestMeta = details.requestMeta
  }

  return entry
}

export function buildApiErrorResponse(
  error: ApiFunctionError,
  options?: ApiErrorResponseOptions
): Response {
  const body = error.toResponseBody({
    ...(options?.fallbackMessage !== undefined && { fallbackMessage: options.fallbackMessage }),
    ...(options?.includeDetails !== undefined && { includeDetails: options.includeDetails }),
  })

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  }

  return new Response(JSON.stringify(body), {
    status: error.status,
    headers,
  })
}

type LogMetadata = {
  route: string
  operation?: string | undefined
  runtime?: string | undefined
  region?: string | undefined
  consentFunctional: boolean
  requestId?: string | undefined
  correlationId?: string | undefined
  requestMeta?: SanitizedRequestMetadata | undefined
}

function logApiError(error: ApiFunctionError, metadata: LogMetadata) {
  if (isTest()) {
    return
  }

  const entry = formatApiErrorLogEntry(error, metadata)
  console.error(JSON.stringify(entry))
}

function sanitizeRequestMetadata(
  metadata: ApiRequestMetadata | undefined,
  salt: string
): SanitizedRequestMetadata {
  if (!metadata) {
    return {}
  }

  return {
    ...(metadata.method && { method: metadata.method }),
    ...(metadata.ipHash
      ? { ipHash: metadata.ipHash }
      : metadata.ip
        ? { ipHash: hashIdentifier(metadata.ip, salt) }
        : {}),
    ...(metadata.userAgentHash
      ? { uaHash: metadata.userAgentHash }
      : metadata.userAgent
        ? { uaHash: hashIdentifier(metadata.userAgent, salt) }
        : {}),
  }
}

function hashIdentifier(value: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${value}`).digest('hex')
}
