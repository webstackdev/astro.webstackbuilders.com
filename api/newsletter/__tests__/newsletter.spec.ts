import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

/**
 * Unit tests for Newsletter API Handler (Double Opt-in Flow)
 *
 * Tests cover:
 * - HTTP method validation
 * - CORS headers
 * - Input validation
 * - GDPR consent validation
 * - Double opt-in flow (token + email)
 * - Error handling
 * - Rate limiting
 *
 * Note: These tests focus on the main handler function behavior
 * with comprehensive mocking of external dependencies.
 */

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

// Mock console methods
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'log').mockImplementation(() => {})

describe('Newsletter API Handler', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handler: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let createPendingSubscription: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sendConfirmationEmail: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recordConsent: any
  const originalEnv = process.env

  beforeEach(async () => {
    vi.clearAllMocks()

    // Set up test environment
    process.env = { ...originalEnv }
    process.env['CONVERTKIT_API_KEY'] = 'test-api-key'
    process.env['RESEND_API_KEY'] = 'test-resend-key'
    process.env['SITE_URL'] = 'http://localhost:4321'

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

    // Import the handler
    const module = await import('../newsletter')
    handler = module.default
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('HTTP Method Validation', () => {
    it('should handle OPTIONS method for CORS preflight', async () => {
      const mockReq = { method: 'OPTIONS' }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.end).toHaveBeenCalled()
    })

    it('should reject non-POST methods', async () => {
      const mockReq = { method: 'GET' }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(405)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Method not allowed',
      })
    })
  })

  describe('CORS Headers', () => {
    it('should set proper CORS headers', async () => {
      const mockReq = {
        method: 'POST',
        headers: { 'user-agent': 'test-agent' },
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

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type')
    })
  })

  describe('Input Validation', () => {
    it('should reject missing email', async () => {
      const mockReq = {
        method: 'POST',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: {},
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
        error: 'Email address is required.',
      })
    })

    it('should reject invalid email format', async () => {
      const mockReq = {
        method: 'POST',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'invalid-email' },
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
        error: 'Email address is invalid',
      })
    })
  })

  describe('Successful Subscriptions (Double Opt-in)', () => {
    it('should require GDPR consent', async () => {
      const mockReq = {
        method: 'POST',
        headers: { 'user-agent': 'test-agent' },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com', consentGiven: false },
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
        error: 'You must consent to receive marketing emails to subscribe.',
      })
      expect(createPendingSubscription).not.toHaveBeenCalled()
      expect(sendConfirmationEmail).not.toHaveBeenCalled()
    })

    it('should handle successful double opt-in initiation with email only', async () => {
      const mockReq = {
        method: 'POST',
        headers: { 'user-agent': 'test-agent' },
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

      expect(recordConsent).toHaveBeenCalledWith({
        email: 'test@example.com',
        purposes: ['marketing'],
        source: 'newsletter_form',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        verified: false,
      })

      expect(createPendingSubscription).toHaveBeenCalledWith({
        email: 'test@example.com',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        source: 'newsletter_form',
      })

      expect(sendConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'test-token-123',
        undefined
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Please check your email to confirm your subscription.',
        requiresConfirmation: true,
      })
    })

    it('should handle successful double opt-in initiation with email and name', async () => {
      const mockReq = {
        method: 'POST',
        headers: { 'user-agent': 'test-agent' },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'jane@example.com', firstName: 'Jane', consentGiven: true },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      expect(recordConsent).toHaveBeenCalledWith({
        email: 'jane@example.com',
        purposes: ['marketing'],
        source: 'newsletter_form',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        verified: false,
      })

      expect(createPendingSubscription).toHaveBeenCalledWith({
        email: 'jane@example.com',
        firstName: 'Jane',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        source: 'newsletter_form',
      })

      expect(sendConfirmationEmail).toHaveBeenCalledWith(
        'jane@example.com',
        'test-token-123',
        'Jane'
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Please check your email to confirm your subscription.',
        requiresConfirmation: true,
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle email sending errors', async () => {
      const mockReq = {
        method: 'POST',
        headers: { 'user-agent': 'test-agent' },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com', consentGiven: true },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      sendConfirmationEmail.mockRejectedValueOnce(new Error('Email service error'))

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email service error',
      })
    })

    it('should handle token creation errors', async () => {
      const mockReq = {
        method: 'POST',
        headers: { 'user-agent': 'test-agent' },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com', consentGiven: true },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      createPendingSubscription.mockRejectedValueOnce(new Error('Token generation failed'))

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token generation failed',
      })
    })

    it('should handle consent recording errors', async () => {
      const mockReq = {
        method: 'POST',
        headers: { 'user-agent': 'test-agent' },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com', consentGiven: true },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      recordConsent.mockRejectedValueOnce(new Error('Database error'))

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const mockReq = {
        method: 'POST',
        headers: { 'user-agent': 'test-agent' },
        socket: { remoteAddress: '192.168.1.100' },
        body: { email: 'test@example.com', consentGiven: true },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      // Make 10 requests (should succeed)
      for (let i = 0; i < 10; i++) {
        vi.clearAllMocks()
        await handler(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(200)
      }

      // 11th request should be rate limited
      vi.clearAllMocks()
      await handler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many subscription requests. Please try again later.',
      })
    })
  })

  describe('IP Address Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const mockReq = {
        method: 'POST',
        headers: {
          'x-forwarded-for': '203.0.113.1, 10.0.0.1',
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

      // Should use IP from x-forwarded-for header (203.0.113.1)
      expect(recordConsent).toHaveBeenCalledWith({
        email: 'test@example.com',
        purposes: ['marketing'],
        source: 'newsletter_form',
        userAgent: 'test-agent',
        ipAddress: '203.0.113.1',
        verified: false,
      })

      expect(mockRes.status).toHaveBeenCalledWith(200)
    })
  })
})