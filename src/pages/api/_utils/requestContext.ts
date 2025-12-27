import { createHash } from 'node:crypto'
import type { AstroCookies } from 'astro'
import type {
  ApiFunctionContext,
  ApiFunctionConsent,
  ApiRequestMetadata,
} from '@pages/api/_utils/errors'

export interface ApiFunctionContextOptions {
  route: string
  request: Request
  operation?: string
  cookies?: AstroCookies
  clientAddress?: string
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
  hashSalt?: string
}

export interface BuiltApiFunctionContext {
  context: ApiFunctionContext
  consentFunctional: boolean
  fingerprint?: string
}

const FUNCTIONAL_CONSENT_COOKIE = 'consent_functional'

export function createApiFunctionContext(
  options: ApiFunctionContextOptions
): BuiltApiFunctionContext {
  const hashSalt = options.hashSalt ?? options.route
  const consentFunctional = readFunctionalConsent(options.cookies)
  const requestMeta = buildRequestMetadata(
    options.request,
    hashSalt,
    consentFunctional,
    options.clientAddress
  )

  const consent: ApiFunctionConsent = {
    functional: consentFunctional,
  }

  const context: ApiFunctionContext = {
    route: options.route,
    consent,
    requestMeta,
    hashSalt,
  }

  if (options.operation !== undefined) context.operation = options.operation
  if (options.requestId !== undefined) context.requestId = options.requestId
  if (options.correlationId !== undefined) context.correlationId = options.correlationId
  if (options.runtime !== undefined) context.runtime = options.runtime
  if (options.region !== undefined) context.region = options.region
  if (options.user !== undefined) context.user = options.user
  if (options.status !== undefined) context.status = options.status
  if (options.code !== undefined) context.code = options.code
  if (options.extra !== undefined) context.extra = options.extra

  const result: BuiltApiFunctionContext = {
    context,
    consentFunctional,
  }

  const fingerprint = requestMeta.ipHash ?? requestMeta.userAgentHash
  if (fingerprint) {
    result.fingerprint = fingerprint
  }

  return result
}

export function createRateLimitIdentifier(scope: string, fingerprint?: string): string {
  return `${scope}:${fingerprint ?? 'anonymous'}`
}

function readFunctionalConsent(cookies?: AstroCookies): boolean {
  const consentValue = cookies?.get(FUNCTIONAL_CONSENT_COOKIE)?.value
  return consentValue === 'true'
}

function buildRequestMetadata(
  request: Request,
  salt: string,
  includeRawPII: boolean,
  clientAddress?: string
): ApiRequestMetadata {
  const method = request.method
  const ip = extractClientIp(request) ?? clientAddress
  const userAgent = request.headers.get('user-agent') ?? undefined

  const metadata: ApiRequestMetadata = {
    ...(method && { method }),
    ...(ip && { ipHash: hashIdentifier(ip, salt) }),
    ...(userAgent && { userAgentHash: hashIdentifier(userAgent, salt) }),
  }

  if (includeRawPII) {
    if (ip) {
      metadata.ip = ip
    }
    if (userAgent) {
      metadata.userAgent = userAgent
    }
  }

  return metadata
}

function extractClientIp(request: Request): string | undefined {
  const headers = request.headers
  const candidates = [
    headers.get('x-forwarded-for'),
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('fastly-client-ip'),
  ]

  for (const value of candidates) {
    if (value) {
      const [first] = value.split(',')
      if (first) {
        const normalized = first.trim()
        if (normalized) {
          return normalized
        }
      }
    }
  }

  return undefined
}

function hashIdentifier(value: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${value}`).digest('hex')
}
