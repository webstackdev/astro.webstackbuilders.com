import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { sendDSARVerificationEmail } from '@pages/api/_utils/gdpr-email'

// Mock the Resend module
vi.mock('resend', () => {
  const mockSend = vi.fn()
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  }
})

describe('GDPR Email Utils', () => {
  let mockResendSend: ReturnType<typeof vi.fn>
  let originalEnv: Record<string, string | undefined>
  let consoleLogSpy: ReturnType<typeof vi.fn>
  let consoleErrorSpy: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Store original env
    originalEnv = { ...process.env }

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Get the mock function from the mocked Resend class
    const { Resend } = await import('resend')
    const resendInstance = new Resend('test-key')
    mockResendSend = resendInstance.emails.send as ReturnType<typeof vi.fn>

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('sendDSARVerificationEmail', () => {
    describe('in development/test environment', () => {
      it('should log email details instead of sending in development mode', async () => {
        process.env['NODE_ENV'] = 'development'

        await sendDSARVerificationEmail('test@example.com', 'test-token', 'ACCESS')

        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[DEV/TEST MODE] DSAR verification email would be sent:',
          {
            email: 'test@example.com',
            token: 'test-token',
            requestType: 'ACCESS',
          }
        )
        expect(mockResendSend).not.toHaveBeenCalled()
      })

      it('should log email details instead of sending in test mode', async () => {
        process.env['NODE_ENV'] = 'test'

        await sendDSARVerificationEmail('test@example.com', 'test-token', 'DELETE')

        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[DEV/TEST MODE] DSAR verification email would be sent:',
          {
            email: 'test@example.com',
            token: 'test-token',
            requestType: 'DELETE',
          }
        )
        expect(mockResendSend).not.toHaveBeenCalled()
      })

      it('should log email details instead of sending in CI mode', async () => {
        process.env['NODE_ENV'] = 'production'
        process.env['CI'] = 'true'

        await sendDSARVerificationEmail('test@example.com', 'test-token', 'ACCESS')

        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[DEV/TEST MODE] DSAR verification email would be sent:',
          {
            email: 'test@example.com',
            token: 'test-token',
            requestType: 'ACCESS',
          }
        )
        expect(mockResendSend).not.toHaveBeenCalled()
      })
    })

    describe('in production environment', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production'
        process.env['CI'] = 'false'
        process.env['RESEND_API_KEY'] = 'test-resend-key'
        process.env['SITE_URL'] = 'https://webstackbuilders.com'
      })

      it('should send ACCESS verification email successfully', async () => {
        mockResendSend.mockResolvedValue({
          data: { id: 'message-id-123' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'verification-token-123', 'ACCESS')

        expect(mockResendSend).toHaveBeenCalledTimes(1)
        const callArgs = mockResendSend.mock.calls[0]?.[0]
        expect(callArgs).toBeDefined()

        expect(callArgs!.from).toBe('Webstack Builders <privacy@webstackbuilders.com>')
        expect(callArgs!.to).toBe('user@example.com')
        expect(callArgs!.subject).toBe('Verify Your Data Access Request - Webstack Builders')
        expect(callArgs!.html).toContain('Data Access Request')
        expect(callArgs!.html).toContain('access your data')
        expect(callArgs!.html).toContain('https://webstackbuilders.com/api/gdpr/verify?token=verification-token-123')
        expect(callArgs!.text).toContain('Data Access Request')
        expect(callArgs!.tags).toEqual([
          { name: 'type', value: 'gdpr-verification' },
          { name: 'request-type', value: 'access' },
        ])

        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[DSAR Email] Verification sent successfully:',
          {
            email: 'user@example.com',
            requestType: 'ACCESS',
            messageId: 'message-id-123',
          }
        )
      })

      it('should send DELETE verification email successfully with warning', async () => {
        mockResendSend.mockResolvedValue({
          data: { id: 'message-id-456' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'delete-token-456', 'DELETE')

        expect(mockResendSend).toHaveBeenCalledTimes(1)
        const callArgs = mockResendSend.mock.calls[0]?.[0]
        expect(callArgs).toBeDefined()

        expect(callArgs!.subject).toBe('Verify Your Data Deletion Request - Webstack Builders')
        expect(callArgs!.html).toContain('Data Deletion Request')
        expect(callArgs!.html).toContain('delete your data')
        expect(callArgs!.html).toContain('⚠️ Important')
        expect(callArgs!.html).toContain('permanently delete all your data')
        expect(callArgs!.text).toContain('⚠️ IMPORTANT')
        expect(callArgs!.tags).toEqual([
          { name: 'type', value: 'gdpr-verification' },
          { name: 'request-type', value: 'delete' },
        ])
      })

      it('should use default localhost URL when SITE_URL is not set', async () => {
        delete process.env['SITE_URL']
        mockResendSend.mockResolvedValue({
          data: { id: 'message-id-789' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'token-789', 'ACCESS')

        const callArgs = mockResendSend.mock.calls[0]?.[0]
        expect(callArgs).toBeDefined()
        expect(callArgs!.html).toContain('http://localhost:4321/api/gdpr/verify?token=token-789')
        expect(callArgs!.text).toContain('http://localhost:4321/api/gdpr/verify?token=token-789')
      })

      it('should throw error when RESEND_API_KEY is not set', async () => {
        delete process.env['RESEND_API_KEY']

        await expect(
          sendDSARVerificationEmail('user@example.com', 'token-123', 'ACCESS')
        ).rejects.toThrow('RESEND_API_KEY environment variable is not set')

        expect(mockResendSend).not.toHaveBeenCalled()
      })

      it('should handle Resend API error response', async () => {
        mockResendSend.mockResolvedValue({
          data: null,
          error: {
            message: 'Invalid API key',
            name: 'validation_error',
          },
        })

        await expect(
          sendDSARVerificationEmail('user@example.com', 'token-123', 'ACCESS')
        ).rejects.toThrow('Failed to send verification email: Invalid API key')

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[DSAR Email] Failed to send verification:',
          expect.objectContaining({
            message: 'Invalid API key',
            name: 'validation_error',
          })
        )
      })

      it('should handle Resend API network error', async () => {
        const networkError = new Error('Network failure')
        mockResendSend.mockRejectedValue(networkError)

        await expect(
          sendDSARVerificationEmail('user@example.com', 'token-123', 'ACCESS')
        ).rejects.toThrow('Network failure')

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[DSAR Email] Error sending verification:',
          networkError
        )
      })

      it('should include current year in email content', async () => {
        const currentYear = new Date().getFullYear()
        mockResendSend.mockResolvedValue({
          data: { id: 'message-id-year' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'token-year', 'ACCESS')

        const callArgs = mockResendSend.mock.calls[0]?.[0]
        expect(callArgs).toBeDefined()
        expect(callArgs!.html).toContain(`© ${currentYear} Webstack Builders`)
        expect(callArgs!.text).toContain(`© ${currentYear} Webstack Builders`)
      })

      it('should generate proper verification URLs with tokens', async () => {
        process.env['SITE_URL'] = 'https://example.com'
        mockResendSend.mockResolvedValue({
          data: { id: 'message-id-url' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'special-token-123', 'DELETE')

        const callArgs = mockResendSend.mock.calls[0]?.[0]
        expect(callArgs).toBeDefined()
        const expectedUrl = 'https://example.com/api/gdpr/verify?token=special-token-123'

        expect(callArgs!.html).toContain(`href="${expectedUrl}"`)
        expect(callArgs!.html).toContain(expectedUrl) // Also as plain text in email
        expect(callArgs!.text).toContain(expectedUrl)
      })
    })
  })
})