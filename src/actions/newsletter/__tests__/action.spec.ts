import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  NewsletterSubscribeInput,
  NewsletterSubscribeOutput,
  NewsletterConfirmInput,
  NewsletterConfirmOutput,
  ActionConfig,
} from '@actions/newsletter/@types'

const getMockedHandler = <Input, Output>(action: unknown): ActionConfig<Input, Output>['handler'] => {
  return (action as ActionConfig<Input, Output>).handler
}

vi.mock('astro:actions', () => {
  class ActionError extends Error {
    public code: string

    constructor({ code, message }: { code: string; message: string }) {
      super(message)
      this.code = code
      this.name = 'ActionError'
    }
  }

  return {
    ActionError,
    defineAction: (config: unknown) => config,
  }
})

vi.mock('@actions/utils/environment/environmentActions', () => {
  return {
    getPrivacyPolicyVersion: vi.fn(() => 'test-privacy-policy-version'),
  }
})

vi.mock('@actions/utils/requestContext', () => {
  return {
    buildRequestFingerprint: vi.fn(() => ({ fingerprint: 'fingerprint-1' })),
    createRateLimitIdentifier: vi.fn(() => 'newsletter:consent:fingerprint-1'),
  }
})

vi.mock('@actions/utils/rateLimit', () => {
  return {
    rateLimiters: { consent: { id: 'consent' } },
    checkRateLimit: vi.fn(async () => ({ success: true, reset: Date.now() + 10_000 })),
  }
})

vi.mock('@actions/newsletter/utils', () => {
  return {
    validateEmail: vi.fn((email: string) => email.trim().toLowerCase()),
  }
})

vi.mock('@actions/gdpr/entities/consent', () => {
  return {
    createConsentRecord: vi.fn(async () => ({ id: 'consent-1' })),
    markConsentRecordsVerified: vi.fn(async () => undefined),
  }
})

vi.mock('@actions/newsletter/domain', () => {
  return {
    createPendingSubscription: vi.fn(async () => 'token-123'),
    confirmSubscription: vi.fn(async () => null),
  }
})

vi.mock('@actions/newsletter/entities/email', () => {
  return {
    sendConfirmationEmail: vi.fn(async () => undefined),
    sendWelcomeEmail: vi.fn(async () => undefined),
  }
})

vi.mock('@actions/newsletter/entities/subscribe', () => {
  return {
    subscribeToConvertKit: vi.fn(async () => undefined),
  }
})

vi.mock('@actions/utils/errors', async () => {
  const astro = await import('astro:actions')

  class ActionsFunctionError extends Error {
    public status: number

    constructor(
      messageOrOptions:
        | string
        | {
            message: string
            status?: number
          },
      options?: { status?: number }
    ) {
      const message = typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions.message
      super(message)
      this.name = 'ActionsFunctionError'

      const status =
        typeof messageOrOptions === 'string'
          ? options?.status
          : messageOrOptions.status

      this.status = typeof status === 'number' ? status : 500
    }
  }

  function throwActionError(
    _error: unknown,
    _context: unknown,
    options?: { fallbackMessage?: string }
  ): never {
    const message = options?.fallbackMessage ?? 'Internal server error'
    throw new (
      astro as unknown as { ActionError: new (_opts: { code: string; message: string }) => Error }
    ).ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    })
  }

  return {
    ActionsFunctionError,
    handleActionsFunctionError: vi.fn(() => undefined),
    throwActionError: vi.fn(throwActionError),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('newsletter.subscribe.handler', () => {
  it('rejects when consent is missing', async () => {
    const { newsletter } = await import('../action')

    const context = {
      request: new Request('https://example.com/_actions/newsletter/subscribe', {
        method: 'POST',
        headers: { 'user-agent': 'ua-1' },
      }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.10',
    }

    await expect(
      getMockedHandler<NewsletterSubscribeInput, NewsletterSubscribeOutput>(newsletter.subscribe)(
        { email: 'test@example.com', consentGiven: false },
        context
      )
    ).rejects.toMatchObject({
      name: 'ActionsFunctionError',
      status: 400,
      message: 'You must consent to receive marketing emails to subscribe.',
    })
  })

  it('rejects when DataSubjectId is invalid', async () => {
    const { newsletter } = await import('../action')

    const context = {
      request: new Request('https://example.com/_actions/newsletter/subscribe', {
        method: 'POST',
        headers: { 'user-agent': 'ua-2' },
      }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.11',
    }

    await expect(
      getMockedHandler<NewsletterSubscribeInput, NewsletterSubscribeOutput>(newsletter.subscribe)(
        {
          email: 'test@example.com',
          consentGiven: true,
          DataSubjectId: 'not-a-uuid',
        },
        context
      )
    ).rejects.toMatchObject({
      name: 'ActionsFunctionError',
      status: 400,
      message: 'Invalid DataSubjectId format',
    })
  })

  it('creates consent + pending subscription and sends confirmation email', async () => {
    const { newsletter } = await import('../action')
    const { createConsentRecord } = await import('@actions/gdpr/entities/consent')
    const { createPendingSubscription } = await import('@actions/newsletter/domain')
    const { sendConfirmationEmail } = await import('@actions/newsletter/entities/email')

    const context = {
      request: new Request('https://example.com/_actions/newsletter/subscribe', {
        method: 'POST',
        headers: { 'user-agent': 'ua-3' },
      }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.12',
    }

    const response = await getMockedHandler<NewsletterSubscribeInput, NewsletterSubscribeOutput>(
      newsletter.subscribe
    )(
      { email: ' TEST@Example.com ', consentGiven: true },
      context
    )

    expect(response).toEqual({
      success: true,
      message: 'Please check your email to confirm your subscription.',
      requiresConfirmation: true,
    })

    expect(createConsentRecord).toHaveBeenCalledTimes(1)
    const consentCall = vi.mocked(createConsentRecord).mock.calls[0]?.[0]
    expect(consentCall).toMatchObject({
      purposes: ['marketing'],
      source: 'newsletter_form',
      userAgent: 'ua-3',
      ipAddress: '203.0.113.12',
      verified: false,
      email: 'test@example.com',
      privacyPolicyVersion: 'test-privacy-policy-version',
    })

    expect(createPendingSubscription).toHaveBeenCalledTimes(1)
    const pendingCall = vi.mocked(createPendingSubscription).mock.calls[0]?.[0]
    expect(pendingCall).toMatchObject({
      email: 'test@example.com',
      userAgent: 'ua-3',
      ipAddress: '203.0.113.12',
      source: 'newsletter_form',
    })
    expect(pendingCall?.DataSubjectId).toBe(consentCall?.dataSubjectId)

    expect(sendConfirmationEmail).toHaveBeenCalledWith('test@example.com', 'token-123', undefined)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@actions/utils/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, reset: Date.now() + 2_000 })

    const { newsletter } = await import('../action')

    const context = {
      request: new Request('https://example.com/_actions/newsletter/subscribe', {
        method: 'POST',
        headers: { 'user-agent': 'ua-4' },
      }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.13',
    }

    await expect(
      getMockedHandler<NewsletterSubscribeInput, NewsletterSubscribeOutput>(newsletter.subscribe)(
        { email: 'test@example.com', consentGiven: true },
        context
      )
    ).rejects.toMatchObject({
      name: 'ActionsFunctionError',
      status: 429,
    })
  })

  it('wraps unexpected errors with throwActionError', async () => {
    vi.resetModules()

    const { buildRequestFingerprint } = await import('@actions/utils/requestContext')
    vi.mocked(buildRequestFingerprint).mockImplementationOnce(() => {
      throw new Error('boom')
    })

    const { newsletter } = await import('../action')
    const { throwActionError } = await import('@actions/utils/errors')

    const context = {
      request: new Request('https://example.com/_actions/newsletter/subscribe', {
        method: 'POST',
        headers: { 'user-agent': 'ua-5' },
      }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.14',
    }

    await expect(
      getMockedHandler<NewsletterSubscribeInput, NewsletterSubscribeOutput>(newsletter.subscribe)(
        { email: 'test@example.com', consentGiven: true },
        context
      )
    ).rejects.toMatchObject({
      name: 'ActionError',
      code: 'INTERNAL_SERVER_ERROR',
    })

    expect(throwActionError).toHaveBeenCalledWith(
      expect.any(Error),
      { route: '/_actions/newsletter/subscribe', operation: 'subscribe' }
    )
  })
})

describe('newsletter.confirm.handler', () => {
  it('returns expired when token is invalid/used', async () => {
    const { confirmSubscription } = await import('@actions/newsletter/domain')
    vi.mocked(confirmSubscription).mockResolvedValueOnce(null)

    const { newsletter } = await import('../action')

    const context = {
      request: new Request('https://example.com/_actions/newsletter/confirm', { method: 'POST' }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.15',
    }

    const response = await getMockedHandler<NewsletterConfirmInput, NewsletterConfirmOutput>(
      newsletter.confirm
    )({ token: 'token-xyz' }, context)

    expect(response).toEqual({
      success: false,
      status: 'expired',
      message: 'This confirmation link has expired or been used already.',
    })
  })

  it('marks consent verified and completes subscription side effects', async () => {
    const { confirmSubscription } = await import('@actions/newsletter/domain')
    vi.mocked(confirmSubscription).mockResolvedValueOnce({
      email: 'test@example.com',
      firstName: 'Test',
      DataSubjectId: '3f2d0e5a-7e8d-4b3c-9a6a-2b5d84c6f3a2',
      token: 'token-123',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000).toISOString(),
      consentTimestamp: new Date().toISOString(),
      userAgent: 'ua-confirm',
      verified: true,
      source: 'newsletter_form',
    })

    const { newsletter } = await import('../action')
    const { markConsentRecordsVerified } = await import('@actions/gdpr/entities/consent')
    const { sendWelcomeEmail } = await import('@actions/newsletter/entities/email')
    const { subscribeToConvertKit } = await import('@actions/newsletter/entities/subscribe')

    const context = {
      request: new Request('https://example.com/_actions/newsletter/confirm', { method: 'POST' }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.16',
    }

    const response = await getMockedHandler<NewsletterConfirmInput, NewsletterConfirmOutput>(
      newsletter.confirm
    )({ token: 'token-123' }, context)

    expect(markConsentRecordsVerified).toHaveBeenCalledWith(
      'test@example.com',
      '3f2d0e5a-7e8d-4b3c-9a6a-2b5d84c6f3a2'
    )
    expect(sendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'Test')
    expect(subscribeToConvertKit).toHaveBeenCalledWith({ email: 'test@example.com', firstName: 'Test' })

    expect(response).toMatchObject({
      success: true,
      status: 'success',
      email: 'test@example.com',
      message: 'Your subscription has been confirmed!',
    })
  })

  it('continues even if welcome email fails', async () => {
    const { confirmSubscription } = await import('@actions/newsletter/domain')
    vi.mocked(confirmSubscription).mockResolvedValueOnce({
      email: 'test@example.com',
      firstName: 'Test',
      DataSubjectId: '3f2d0e5a-7e8d-4b3c-9a6a-2b5d84c6f3a2',
      token: 'token-123',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000).toISOString(),
      consentTimestamp: new Date().toISOString(),
      userAgent: 'ua-confirm',
      verified: true,
      source: 'newsletter_form',
    })

    const { sendWelcomeEmail } = await import('@actions/newsletter/entities/email')
    vi.mocked(sendWelcomeEmail).mockRejectedValueOnce(new Error('SMTP down'))

    const { newsletter } = await import('../action')
    const { handleActionsFunctionError } = await import('@actions/utils/errors')

    const context = {
      request: new Request('https://example.com/_actions/newsletter/confirm', { method: 'POST' }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.16',
    }

    const response = await getMockedHandler<NewsletterConfirmInput, NewsletterConfirmOutput>(
      newsletter.confirm
    )({ token: 'token-123' }, context)

    expect(handleActionsFunctionError).toHaveBeenCalledWith(expect.any(Error), {
      route: '/_actions/newsletter/confirm',
      operation: 'sendWelcomeEmail',
    })

    expect(response).toMatchObject({ success: true, status: 'success' })
  })
})
