/**
 * Request context helpers for actions.
 *
 * This module builds a stable, privacy-aware request fingerprint that can be used for
 * coarse-grained concerns like rate limiting (e.g. "per route + per visitor") without
 * requiring user accounts.
 *
 * How it works:
 * - Reads the `consent_functional` cookie to decide whether raw identifiers (IP address
 * / user agent) may be included.
 * - Extracts the best-effort client IP from common proxy/CDN headers (`x-forwarded-for`, `cf-connecting-ip`, etc.).
 * - Uses `clientAddress` as a fallback when the runtime provides an address out-of-band.
 * - Hashes identifiers with SHA-256 using a per-route salt (`route`) so the same identifier
 * yields different hashes per route.
 * - Does not store/return raw values unless functional consent is present.
 * - Chooses a single fingerprint preferring `ipHash`, falling back to `userAgentHash`.
 *
 * Notes:
 * - Fingerprints are for aggregation/rate limiting only; they are not authentication.
 * - Header-based IP extraction is best-effort and can be spoofed depending on deployment.
 */
import { createHash } from 'node:crypto'
import type { AstroCookies } from 'astro'

const FUNCTIONAL_CONSENT_COOKIE = 'consent_functional'

export function createRateLimitIdentifier(scope: string, fingerprint?: string): string {
  return `${scope}:${fingerprint ?? 'anonymous'}`
}

export function buildRequestFingerprint(options: {
  route: string
  request: Request
  cookies?: AstroCookies
  clientAddress?: string
}): { fingerprint?: string; consentFunctional: boolean } {
  const hashSalt = options.route
  const consentFunctional = readFunctionalConsent(options.cookies)
  const requestMeta = buildRequestMetadata(options.request, hashSalt, consentFunctional, options.clientAddress)
  const fingerprint = requestMeta.ipHash ?? requestMeta.userAgentHash

  const result: { fingerprint?: string; consentFunctional: boolean } = {
    consentFunctional,
  }

  if (fingerprint) {
    result.fingerprint = fingerprint
  }

  return result
}

type RequestMetadata = {
  method?: string
  ip?: string
  ipHash?: string
  userAgent?: string
  userAgentHash?: string
}

function readFunctionalConsent(cookies?: AstroCookies): boolean {
  const consentValue = cookies?.get(FUNCTIONAL_CONSENT_COOKIE)?.value
  return consentValue === 'true'
}

function buildRequestMetadata(
  request: Request,
  salt: string,
  includeRawPII: boolean,
  clientAddress?: string,
): RequestMetadata {
  const method = request.method
  const ip = extractClientIp(request) ?? clientAddress
  const userAgent = request.headers.get('user-agent') ?? undefined

  const metadata: RequestMetadata = {
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
