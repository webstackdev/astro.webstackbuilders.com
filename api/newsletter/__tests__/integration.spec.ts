import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from '../newsletter'

describe('Newsletter API Integration Tests', () => {
  const originalEnv = process.env
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock environment variables
    process.env = {
      ...originalEnv,
      CONVERTKIT_API_KEY: 'test-api-key',
      CONVERTKIT_FORM_ID: 'test-form-id',
    }

    // Mock global fetch
    mockFetch = vi.fn()
    global.fetch = mockFetch

    // Mock console methods to suppress logs during tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('Complete Workflow Integration', () => {
    it('should handle complete subscription workflow for new user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          /* eslint-disable camelcase */
          subscriber: {
            id: 12345,
            email_address: 'test@example.com',
            state: 'active',
            first_name: null
          }
          /* eslint-enable camelcase */
        }),
      })

      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'origin': 'https://webstackbuilders.com'
        },
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

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully subscribed to newsletter!',
        subscriber: {
          email: 'test@example.com',
          firstName: null
        }
      })
    })

    it('should handle subscription with name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          /* eslint-disable camelcase */
          subscriber: {
            id: 67890,
            first_name: 'Jane Smith',
            email_address: 'jane@example.com',
            state: 'active'
          }
          /* eslint-enable camelcase */
        }),
      })

      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'origin': 'https://webstackbuilders.com'
        },
        socket: { remoteAddress: '192.168.1.100' },
        body: {
          email: 'jane@example.com',
          firstName: 'Jane Smith',
        },
      }

      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.kit.com/v4/subscribers',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Kit-Api-Key': 'test-api-key'
          },
          body: JSON.stringify({
            /* eslint-disable camelcase */
            email_address: 'jane@example.com',
            state: 'active',
            first_name: 'Jane Smith',
            /* eslint-enable camelcase */
          }),
        }),
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully subscribed to newsletter!',
        subscriber: {
          email: 'jane@example.com',
          firstName: 'Jane Smith'
        }
      })
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({
          message: 'Email address is invalid',
          errors: ['Email is not a valid email address'],
        }),
      })

      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'invalid@test.com' },
      }

      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Input Validation Integration', () => {
    it('should validate email format', async () => {
      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        socket: { remoteAddress: '127.0.0.1' },
        body: { email: 'not-an-email' },
      }

      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn(() => mockRes),
        json: vi.fn(() => mockRes),
        end: vi.fn(() => mockRes),
      }

      await handler(mockReq, mockRes)

      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should handle missing email', async () => {
      const mockReq = {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
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

      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })
})