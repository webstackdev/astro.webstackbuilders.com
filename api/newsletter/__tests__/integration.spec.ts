import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from '../newsletter'

// Mock the new dependencies for double opt-in flow
vi.mock('../token', () => ({
  createPendingSubscription: vi.fn(),
}))

vi.mock('../email', () => ({
  sendConfirmationEmail: vi.fn(),
}))

vi.mock('../../shared/consent-log', () => ({
  recordConsent: vi.fn(),
}))

describe('Newsletter API Integration Tests', () => {
  const originalEnv = process.env
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let createPendingSubscription: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sendConfirmationEmail: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recordConsent: any

  beforeEach(async () => {
    // Mock environment variables
    process.env = {
      ...originalEnv,
      CONVERTKIT_API_KEY: 'test-api-key',
      CONVERTKIT_FORM_ID: 'test-form-id',
      RESEND_API_KEY: 'test-resend-key',
      SITE_URL: 'http://localhost:4321',
    }

    // Import the mocked modules
    const tokenModule = await import('../token')
    const emailModule = await import('../email')
    const consentModule = await import('../../shared/consent-log')

    createPendingSubscription = tokenModule.createPendingSubscription
    sendConfirmationEmail = emailModule.sendConfirmationEmail
    recordConsent = consentModule.recordConsent

    // Set up default mock implementations
    createPendingSubscription.mockResolvedValue('test-token-123')
    sendConfirmationEmail.mockResolvedValue(undefined)
    recordConsent.mockResolvedValue(undefined)

    // Mock console methods to suppress logs during tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('Complete Workflow Integration', () => {
    it('should handle complete double opt-in workflow for new user', async () => {
      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'origin': 'https://webstackbuilders.com',
          'user-agent': 'test-agent',
        },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com', consentGiven: true },
      }

      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      // Should record consent
      expect(recordConsent).toHaveBeenCalledWith({
        email: 'test@example.com',
        purposes: ['marketing'],
        source: 'newsletter_form',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        verified: false,
      })

      // Should create pending subscription
      expect(createPendingSubscription).toHaveBeenCalledWith({
        email: 'test@example.com',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        source: 'newsletter_form',
      })

      // Should send confirmation email
      expect(sendConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'test-token-123',
        undefined
      )

      // Should return success with confirmation message
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Please check your email to confirm your subscription.',
        requiresConfirmation: true,
      })
    })

    it('should handle subscription with name', async () => {
      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'origin': 'https://webstackbuilders.com',
          'user-agent': 'test-agent',
        },
        socket: { remoteAddress: '192.168.1.100' },
        body: {
          email: 'jane@example.com',
          firstName: 'Jane Smith',
          consentGiven: true,
        },
      }

      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      // Should include first name in pending subscription
      expect(createPendingSubscription).toHaveBeenCalledWith({
        email: 'jane@example.com',
        firstName: 'Jane Smith',
        userAgent: 'test-agent',
        ipAddress: '192.168.1.100',
        source: 'newsletter_form',
      })

      // Should include first name in confirmation email
      expect(sendConfirmationEmail).toHaveBeenCalledWith(
        'jane@example.com',
        'test-token-123',
        'Jane Smith'
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Please check your email to confirm your subscription.',
        requiresConfirmation: true,
      })
    })

    it('should handle API errors gracefully', async () => {
      sendConfirmationEmail.mockRejectedValueOnce(new Error('Email service error'))

      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent',
        },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com', consentGiven: true },
      }

      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email service error',
      })
    })
  })

  describe('Input Validation Integration', () => {
    it('should validate email format', async () => {
      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent',
        },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'not-an-email', consentGiven: true },
      }

      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      expect(recordConsent).not.toHaveBeenCalled()
      expect(sendConfirmationEmail).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should handle missing email', async () => {
      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent',
        },
        socket: { remoteAddress: '127.0.0.1' },
        body: { consentGiven: true },
      }

      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      expect(recordConsent).not.toHaveBeenCalled()
      expect(sendConfirmationEmail).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })
})