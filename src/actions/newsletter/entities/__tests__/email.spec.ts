import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@actions/utils/environment/environmentActions', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
  return {
    ...actual,
    getResendApiKey: () => 'resend-test-key',
    isProd: () => false,
  }
})

vi.mock('@actions/utils/environment/siteUrlActions', () => {
  return {
    getSiteUrl: () => 'https://example.com',
  }
})

vi.mock('resend', () => {
  return {
    Resend: class Resend {
      emails = {
        send: vi.fn(async () => ({ data: { id: 'email-1' } })),
      }

      constructor(_key: string) {}
    },
  }
})

import { sendConfirmationEmail, sendWelcomeEmail } from '../email'

describe('newsletter email entity', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('does not send confirmation email in non-prod (logs and returns)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await sendConfirmationEmail('test@example.com', 'token-1', 'Jane')

    expect(logSpy).toHaveBeenCalled()
  })

  it('throws ActionsFunctionError when Resend returns an error in prod', async () => {
    vi.doMock('@actions/utils/environment/environmentActions', async (importOriginal) => {
      const actual = (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
      return {
        ...actual,
        getResendApiKey: () => 'resend-test-key',
        isProd: () => true,
      }
    })

    vi.doMock('resend', () => {
      return {
        Resend: class Resend {
          emails = {
            send: vi.fn(async () => ({ error: { message: 'boom' } })),
          }

          constructor(_key: string) {}
        },
      }
    })

    vi.resetModules()
    const { sendConfirmationEmail: prodSendConfirmationEmail } = await import('../email')

    await expect(prodSendConfirmationEmail('test@example.com', 'token-1', 'Jane')).rejects.toMatchObject({
      name: 'ActionsFunctionError',
      status: 502,
    })
  })

  it('does not send welcome email in non-prod (logs and returns)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await sendWelcomeEmail('test@example.com', 'Jane')

    expect(logSpy).toHaveBeenCalled()
  })
})
