import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock environment utilities BEFORE importing the module under test
vi.mock('@components/scripts/utils', () => ({
  isDev: vi.fn(() => false),
  isTest: vi.fn(() => false),
}))

// Mock getSiteUrl
vi.mock('@lib/config', () => ({
  getSiteUrl: vi.fn(() => 'https://webstackbuilders.com'),
}))

// Mock astro:env/server
vi.mock('astro:env/server', () => ({
  RESEND_API_KEY: 'test-resend-key',
}))

import { sendDSARVerificationEmail } from '@pages/api/gdpr/_dsarVerificationEmails'
import type { isDev, isTest } from '@components/scripts/utils'
import type { getSiteUrl } from '@lib/config'

// Create mock send function at module level
const mockSend = vi.fn()

// Mock the Resend module
vi.mock('resend', () => {
  return {
    Resend: vi.fn(function ResendMock(_apiKey) {
      return {
        emails: {
          send: mockSend,
        },
      }
    }),
  }
})

describe('GDPR Email Utils', () => {
  let consoleLogSpy: ReturnType<typeof vi.fn>
  let consoleErrorSpy: ReturnType<typeof vi.fn>
  let isDev: ReturnType<typeof vi.fn>
  let isTest: ReturnType<typeof vi.fn>
  let getSiteUrl: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Get the mocked functions
    const utils = await import('@components/scripts/utils')
    isDev = utils.isDev as ReturnType<typeof vi.fn>
    isTest = utils.isTest as ReturnType<typeof vi.fn>
    
    const config = await import('@lib/config')
    getSiteUrl = config.getSiteUrl as ReturnType<typeof vi.fn>

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Reset to production mode by default
    isDev.mockReturnValue(false)
    isTest.mockReturnValue(false)
    getSiteUrl.mockReturnValue('https://webstackbuilders.com')

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('sendDSARVerificationEmail', () => {
    describe('in development/test environment', () => {
      it('should log email details instead of sending when isDev() returns true', async () => {
        isDev.mockReturnValue(true)

        await sendDSARVerificationEmail('test@example.com', 'test-token', 'ACCESS')

        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[DEV/TEST MODE] DSAR verification email would be sent:',
          {
            email: 'test@example.com',
            token: 'test-token',
            requestType: 'ACCESS',
          }
        )
        expect(mockSend).not.toHaveBeenCalled()
      })

      it('should log email details instead of sending when isTest() returns true', async () => {
        isTest.mockReturnValue(true)

        await sendDSARVerificationEmail('test@example.com', 'test-token', 'DELETE')

        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[DEV/TEST MODE] DSAR verification email would be sent:',
          {
            email: 'test@example.com',
            token: 'test-token',
            requestType: 'DELETE',
          }
        )
        expect(mockSend).not.toHaveBeenCalled()
      })
    })

    describe('in production environment', () => {

      it('should send ACCESS verification email successfully', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'message-id-123' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'verification-token-123', 'ACCESS')

        expect(mockSend).toHaveBeenCalledTimes(1)
        const callArgs = mockSend.mock.calls[0]?.[0]
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
        mockSend.mockResolvedValue({
          data: { id: 'message-id-456' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'delete-token-456', 'DELETE')

        expect(mockSend).toHaveBeenCalledTimes(1)
        const callArgs = mockSend.mock.calls[0]?.[0]
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

      it('should use getSiteUrl() return value for verification URL', async () => {
        getSiteUrl.mockReturnValue('http://localhost:4321')
        mockSend.mockResolvedValue({
          data: { id: 'message-id-789' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'token-789', 'ACCESS')

        const callArgs = mockSend.mock.calls[0]?.[0]
        expect(callArgs).toBeDefined()
        expect(callArgs!.html).toContain('http://localhost:4321/api/gdpr/verify?token=token-789')
        expect(callArgs!.text).toContain('http://localhost:4321/api/gdpr/verify?token=token-789')
      })

      it('should handle Resend API error response', async () => {
        mockSend.mockResolvedValue({
          data: null,
          error: {
            message: 'Invalid API key',
            name: 'validation_error',
          },
        })

        await expect(
          sendDSARVerificationEmail('user@example.com', 'token-123', 'ACCESS')
        ).rejects.toThrow()

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[DSAR Email] Failed to send verification',
          expect.objectContaining({
            message: 'Invalid API key',
            name: 'validation_error',
          })
        )
      })

      it('should handle Resend API network error', async () => {
        const networkError = new Error('Network failure')
        mockSend.mockRejectedValue(networkError)

        await expect(
          sendDSARVerificationEmail('user@example.com', 'token-123', 'ACCESS')
        ).rejects.toThrow()

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[DSAR Email] Error sending verification',
          networkError
        )
      })

      it('should include current year in email content', async () => {
        const currentYear = new Date().getFullYear()
        mockSend.mockResolvedValue({
          data: { id: 'message-id-year' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'token-year', 'ACCESS')

        const callArgs = mockSend.mock.calls[0]?.[0]
        expect(callArgs).toBeDefined()
        expect(callArgs!.html).toContain(`© ${currentYear} Webstack Builders`)
        expect(callArgs!.text).toContain(`© ${currentYear} Webstack Builders`)
      })

      it('should generate proper verification URLs with tokens', async () => {
        getSiteUrl.mockReturnValue('https://example.com')
        mockSend.mockResolvedValue({
          data: { id: 'message-id-url' },
          error: null,
        })

        await sendDSARVerificationEmail('user@example.com', 'special-token-123', 'DELETE')

        const callArgs = mockSend.mock.calls[0]?.[0]
        expect(callArgs).toBeDefined()
        const expectedUrl = 'https://example.com/api/gdpr/verify?token=special-token-123'

        expect(callArgs!.html).toContain(`href="${expectedUrl}"`)
        expect(callArgs!.html).toContain(expectedUrl) // Also as plain text in email
        expect(callArgs!.text).toContain(expectedUrl)
      })
    })
  })
})