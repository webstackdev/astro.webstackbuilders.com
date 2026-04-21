import { beforeEach, describe, expect, it, vi } from 'vitest'

type ActionConfig<Input, Output> = {
  handler: (_input: Input, _context: unknown) => Promise<Output>
  input?: unknown
}

type ContactSubmitInput = Record<string, unknown>

type ContactSubmitOutput = {
  success: true
  message: string
}

const getMockedHandler = <Input, Output>(
  action: unknown
): ActionConfig<Input, Output>['handler'] => {
  return (action as ActionConfig<Input, Output>).handler
}

const {
  resendSendMock,
  generateEmailContentMock,
  generateAcknowledgementEmailContentMock,
  handleActionsFunctionErrorMock,
} = vi.hoisted(() => {
  return {
    resendSendMock: vi.fn(),
    generateEmailContentMock: vi.fn(),
    generateAcknowledgementEmailContentMock: vi.fn(),
    handleActionsFunctionErrorMock: vi.fn(),
  }
})

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

vi.mock('resend', () => {
  return {
    Resend: class Resend {
      emails = {
        send: resendSendMock,
      }

      constructor(_key: string) {}
    },
  }
})

vi.mock('@actions/utils/environment/environmentActions', () => {
  return {
    getPrivacyPolicyVersion: vi.fn(() => 'privacy-version-1'),
    getResendApiKey: vi.fn(() => 'resend-test-key'),
    isProd: vi.fn(() => true),
  }
})

vi.mock('@actions/utils/rateLimit', () => {
  return {
    checkContactRateLimit: vi.fn(() => true),
  }
})

vi.mock('@actions/utils/requestContext', () => {
  return {
    buildRequestFingerprint: vi.fn(() => ({ fingerprint: 'fingerprint-1' })),
    createRateLimitIdentifier: vi.fn(() => 'contact:fingerprint-1'),
  }
})

vi.mock('@actions/gdpr/entities/consent', () => {
  return {
    createConsentRecord: vi.fn(async () => ({ id: 'consent-1' })),
  }
})

vi.mock('@actions/utils/hubspot', () => {
  return {
    createOrUpdateContact: vi.fn(async () => ({ id: 'hubspot-1' })),
    setMarketingOptIn: vi.fn(async () => undefined),
  }
})

vi.mock('@actions/utils/errors', async () => {
  const astro = await import('astro:actions')

  class ActionsFunctionError extends Error {
    public status: number
    public isServerError: boolean

    constructor(messageOrError: unknown, options?: { message?: string; status?: number }) {
      const message =
        typeof messageOrError === 'string'
          ? messageOrError
          : messageOrError instanceof Error
            ? messageOrError.message
            : (options?.message ?? 'Internal server error')
      super(message)
      this.name = 'ActionsFunctionError'
      this.status = options?.status ?? 500
      this.isServerError = this.status >= 500
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
    handleActionsFunctionError: handleActionsFunctionErrorMock,
    throwActionError: vi.fn(throwActionError),
  }
})

vi.mock('../responder', () => {
  return {
    generateEmailContent: generateEmailContentMock,
    generateAcknowledgementEmailContent: generateAcknowledgementEmailContentMock,
    getFormDataFromInput: vi.fn(() => ({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there with enough detail.',
      consent: false,
    })),
    parseAttachmentsFromInput: vi.fn(async () => []),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  generateEmailContentMock.mockResolvedValue('<html>admin-email</html>')
  generateAcknowledgementEmailContentMock.mockResolvedValue('<html>ack-email</html>')
  resendSendMock.mockResolvedValue({ data: { id: 'email-1' } })
})

describe('contact.submit.handler', () => {
  it('sends the admin notification and the acknowledgement email', async () => {
    const { contact } = await import('../action')

    const context = {
      request: new Request('https://example.com/_actions/contact/submit', {
        method: 'POST',
        headers: { 'user-agent': 'ua-1' },
      }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.10',
    }

    const result = await getMockedHandler<ContactSubmitInput, ContactSubmitOutput>(contact.submit)(
      {},
      context
    )

    expect(result).toEqual({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!',
    })

    expect(generateEmailContentMock).toHaveBeenCalledTimes(1)
    expect(generateAcknowledgementEmailContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
      }),
      'info@webstackbuilders.com'
    )

    expect(resendSendMock).toHaveBeenCalledTimes(2)

    const firstPayload = resendSendMock.mock.calls[0]?.[0]
    expect(firstPayload).toMatchObject({
      from: 'contact@contact.webstackbuilders.com',
      to: 'info@webstackbuilders.com',
      replyTo: 'jane@example.com',
      subject: 'Contact Form: Jane Doe',
      html: '<html>admin-email</html>',
    })

    const secondPayload = resendSendMock.mock.calls[1]?.[0]
    expect(secondPayload).toMatchObject({
      from: 'contact@contact.webstackbuilders.com',
      to: 'jane@example.com',
      replyTo: 'info@webstackbuilders.com',
      subject: 'We received your message - Webstack Builders',
      html: '<html>ack-email</html>',
    })
  })

  it('logs but does not fail when the acknowledgement email send fails', async () => {
    resendSendMock
      .mockResolvedValueOnce({ data: { id: 'admin-email-1' } })
      .mockResolvedValueOnce({ error: { message: 'ack failed' } })

    const { contact } = await import('../action')

    const context = {
      request: new Request('https://example.com/_actions/contact/submit', {
        method: 'POST',
        headers: { 'user-agent': 'ua-2' },
      }),
      cookies: {} as unknown,
      clientAddress: '203.0.113.11',
    }

    const result = await getMockedHandler<ContactSubmitInput, ContactSubmitOutput>(contact.submit)(
      {},
      context
    )

    expect(result.success).toBe(true)
    expect(handleActionsFunctionErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        route: '/_actions/contact/submit',
        operation: 'sendAcknowledgementEmail',
      })
    )
  })
})
