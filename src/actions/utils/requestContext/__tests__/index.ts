import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { buildRequestFingerprint, createRateLimitIdentifier } from '../index'

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex')

const createCookies = (value: string | undefined) =>
  ({
    get: (key: string) => (key === 'consent_functional' && value !== undefined ? { value } : undefined),
  }) as unknown as import('astro').AstroCookies

describe('requestContext', () => {
  it('createRateLimitIdentifier uses anonymous when fingerprint missing', () => {
    expect(createRateLimitIdentifier('contact')).toBe('contact:anonymous')
  })

  it('createRateLimitIdentifier uses provided fingerprint', () => {
    expect(createRateLimitIdentifier('contact', 'abc')).toBe('contact:abc')
  })

  it('buildRequestFingerprint prefers x-forwarded-for IP hash', () => {
    const request = new Request('https://example.com/actions/contact', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
        'user-agent': 'ua-1',
      },
    })

    const { fingerprint, consentFunctional } = buildRequestFingerprint({
      route: '/actions/contact',
      request,
      cookies: createCookies(undefined),
    })

    expect(consentFunctional).toBe(false)
    expect(fingerprint).toBe(sha256('/actions/contact:203.0.113.10'))
  })

  it('buildRequestFingerprint falls back to user-agent hash when IP missing', () => {
    const request = new Request('https://example.com/actions/contact', {
      method: 'POST',
      headers: {
        'user-agent': 'ua-2',
      },
    })

    const { fingerprint } = buildRequestFingerprint({
      route: '/actions/contact',
      request,
      cookies: createCookies(undefined),
    })

    expect(fingerprint).toBe(sha256('/actions/contact:ua-2'))
  })

  it('buildRequestFingerprint uses clientAddress fallback when headers omit IP', () => {
    const request = new Request('https://example.com/actions/contact', {
      method: 'POST',
      headers: {
        'user-agent': 'ua-3',
      },
    })

    const { fingerprint } = buildRequestFingerprint({
      route: '/actions/contact',
      request,
      cookies: createCookies(undefined),
      clientAddress: '198.51.100.5',
    })

    expect(fingerprint).toBe(sha256('/actions/contact:198.51.100.5'))
  })

  it('buildRequestFingerprint returns no fingerprint when both IP and UA missing', () => {
    const request = new Request('https://example.com/actions/contact', {
      method: 'POST',
      headers: {},
    })

    const { fingerprint } = buildRequestFingerprint({
      route: '/actions/contact',
      request,
      cookies: createCookies(undefined),
    })

    expect(fingerprint).toBeUndefined()
  })

  it('buildRequestFingerprint marks consentFunctional when cookie is true', () => {
    const request = new Request('https://example.com/actions/contact', {
      method: 'POST',
      headers: {
        'user-agent': 'ua-4',
      },
    })

    const { consentFunctional } = buildRequestFingerprint({
      route: '/actions/contact',
      request,
      cookies: createCookies('true'),
    })

    expect(consentFunctional).toBe(true)
  })
})
