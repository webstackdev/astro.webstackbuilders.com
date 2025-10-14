import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

/**
 * Unit tests for Newsletter API Handler
 *
 * Tests cover:
 * - HTTP method validation
 * - CORS headers
 * - Input validation
 * - Success responses
 * - Error handling
 * - Rate limiting
 *
 * Note: These tests focus on the main handler function behavior
 * with comprehensive mocking of external dependencies.
 */

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock console methods
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'log').mockImplementation(() => {})

describe('Newsletter API Handler', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handler: any
  const originalEnv = process.env

  beforeEach(async () => {
    vi.clearAllMocks()

    // Set up test environment
    process.env = { ...originalEnv }
    process.env['CONVERTKIT_API_KEY'] = 'test-api-key'

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
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com' },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      // Mock successful ConvertKit response
      mockFetch.mockResolvedValueOnce({
        status: 201,
        json: () => Promise.resolve({
          /* eslint-disable camelcase */
          subscriber: {
            id: 123,
            first_name: null,
            email_address: 'test@example.com',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            fields: {},
          },
          /* eslint-enable camelcase */
        }),
      })

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

  describe('Successful Subscriptions', () => {
    it('should handle successful subscription with email only', async () => {
      const mockReq = {
        method: 'POST',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com' },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        json: () => Promise.resolve({
          /* eslint-disable camelcase */
          subscriber: {
            id: 123,
            first_name: null,
            email_address: 'test@example.com',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            fields: {},
          },
          /* eslint-enable camelcase */
        }),
      })

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully subscribed to newsletter!',
        subscriber: {
          email: 'test@example.com',
          firstName: null,
        },
      })
    })

    it('should handle successful subscription with email and name', async () => {
      const mockReq = {
        method: 'POST',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'jane@example.com', firstName: 'Jane' },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({
          /* eslint-disable camelcase */
          subscriber: {
            id: 456,
            first_name: 'Jane',
            email_address: 'jane@example.com',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            fields: {},
          },
          /* eslint-enable camelcase */
        }),
      })

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully subscribed to newsletter!',
        subscriber: {
          email: 'jane@example.com',
          firstName: 'Jane',
        },
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle ConvertKit API errors', async () => {
      const mockReq = {
        method: 'POST',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com' },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      mockFetch.mockResolvedValueOnce({
        status: 422,
        json: () => Promise.resolve({ errors: ['Email already exists'] }),
      })

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email already exists',
      })
    })

    it('should handle missing API key', async () => {
      delete process.env['CONVERTKIT_API_KEY']

      const mockReq = {
        method: 'POST',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com' },
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
        error: 'ConvertKit API key is not configured.',
      })
    })

    it('should handle network errors', async () => {
      const mockReq = {
        method: 'POST',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com' },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Network error',
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const mockReq = {
        method: 'POST',
        headers: {},
        socket: { remoteAddress: '192.168.1.100' },
        body: { email: 'test@example.com' },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      // Mock successful responses
      mockFetch.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({
          /* eslint-disable camelcase */
          subscriber: {
            id: 999,
            first_name: null,
            email_address: 'test@example.com',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            fields: {},
          },
          /* eslint-enable camelcase */
        }),
      })

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
        headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'test@example.com' },
      }
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        json: () => Promise.resolve({
          /* eslint-disable camelcase */
          subscriber: {
            id: 123,
            first_name: null,
            email_address: 'test@example.com',
            state: 'active',
            created_at: '2023-01-01T00:00:00Z',
            fields: {},
          },
          /* eslint-enable camelcase */
        }),
      })

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
    })
  })
})