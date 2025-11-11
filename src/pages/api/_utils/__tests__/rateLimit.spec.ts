import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { rateLimiters, checkRateLimit } from '@pages/api/_utils/rateLimit'

// Mock the Upstash Redis and Ratelimit modules
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation((config) => ({
    limit: vi.fn(),
    config,
  })),
}))

describe('Rate Limit Utils', () => {
  let originalEnv: Record<string, string | undefined>
  let mockLimit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Store original env
    originalEnv = { ...import.meta.env }

    // Set test environment variables
    import.meta.env['KV_REST_API_URL'] = 'https://test-redis.upstash.io'
    import.meta.env['KV_REST_API_TOKEN'] = 'test-token'

    // Get the mocked limit function
    mockLimit = vi.fn()

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original environment
    Object.assign(import.meta.env, originalEnv)
  })

  describe('rateLimiters configuration', () => {
    it('should export consent rate limiter', () => {
      expect(rateLimiters.consent).toBeDefined()
      expect(typeof rateLimiters.consent.limit).toBe('function')
    })

    it('should export consentRead rate limiter', () => {
      expect(rateLimiters.consentRead).toBeDefined()
      expect(typeof rateLimiters.consentRead.limit).toBe('function')
    })

    it('should export export rate limiter', () => {
      expect(rateLimiters.export).toBeDefined()
      expect(typeof rateLimiters.export.limit).toBe('function')
    })

    it('should export delete rate limiter', () => {
      expect(rateLimiters.delete).toBeDefined()
      expect(typeof rateLimiters.delete.limit).toBe('function')
    })
  })

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Create a mock rate limiter
      mockLimit = vi.fn()
      const mockRateLimiter = {
        limit: mockLimit,
        config: {},
      }

      // Set the rate limiter for tests
      Object.assign(rateLimiters.consent, mockRateLimiter)
    })

    it('should return success when rate limit is not exceeded', async () => {
      const mockResult = {
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      }
      mockLimit.mockResolvedValue(mockResult)

      const result = await checkRateLimit(rateLimiters.consent, '192.168.1.1')

      expect(mockLimit).toHaveBeenCalledWith('192.168.1.1')
      expect(result).toEqual({
        success: true,
        reset: mockResult.reset,
      })
    })

    it('should return failure when rate limit is exceeded', async () => {
      const mockResult = {
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000,
      }
      mockLimit.mockResolvedValue(mockResult)

      const result = await checkRateLimit(rateLimiters.consent, '192.168.1.1')

      expect(mockLimit).toHaveBeenCalledWith('192.168.1.1')
      expect(result).toEqual({
        success: false,
        reset: mockResult.reset,
      })
    })

    it('should handle different identifiers', async () => {
      const mockResult = {
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      }
      mockLimit.mockResolvedValue(mockResult)

      await checkRateLimit(rateLimiters.export, 'user@example.com')
      expect(mockLimit).toHaveBeenCalledWith('user@example.com')

      await checkRateLimit(rateLimiters.export, '10.0.0.1')
      expect(mockLimit).toHaveBeenCalledWith('10.0.0.1')

      expect(mockLimit).toHaveBeenCalledTimes(2)
    })

    it('should propagate rate limiter errors', async () => {
      const error = new Error('Redis connection failed')
      mockLimit.mockRejectedValue(error)

      await expect(
        checkRateLimit(rateLimiters.consent, '192.168.1.1')
      ).rejects.toThrow('Redis connection failed')

      expect(mockLimit).toHaveBeenCalledWith('192.168.1.1')
    })

    it('should work with different rate limiter configurations', async () => {
      const mockResults = [
        {
          success: true,
          limit: 10,
          remaining: 9,
          reset: Date.now() + 60000,
        },
        {
          success: true,
          limit: 30,
          remaining: 29,
          reset: Date.now() + 60000,
        },
        {
          success: false,
          limit: 5,
          remaining: 0,
          reset: Date.now() + 60000,
        },
      ]

      // Test consent limiter (10 requests per minute)
      Object.assign(rateLimiters.consent, { limit: mockLimit })
      mockLimit.mockResolvedValueOnce(mockResults[0])
      let result = await checkRateLimit(rateLimiters.consent, 'test-ip')
      expect(result.success).toBe(true)

      // Test consentRead limiter (30 requests per minute)
      Object.assign(rateLimiters.consentRead, { limit: mockLimit })
      mockLimit.mockResolvedValueOnce(mockResults[1])
      result = await checkRateLimit(rateLimiters.consentRead, 'test-ip')
      expect(result.success).toBe(true)

      // Test export limiter (5 requests per minute)
      Object.assign(rateLimiters.export, { limit: mockLimit })
      mockLimit.mockResolvedValueOnce(mockResults[2])
      result = await checkRateLimit(rateLimiters.export, 'test-ip')
      expect(result.success).toBe(false)

      expect(mockLimit).toHaveBeenCalledTimes(3)
    })

    it('should handle missing reset timestamp', async () => {
      const mockResult = {
        success: true,
        limit: 10,
        remaining: 9,
        // reset is undefined
      }
      mockLimit.mockResolvedValue(mockResult)

      const result = await checkRateLimit(rateLimiters.consent, '192.168.1.1')

      expect(result).toEqual({
        success: true,
        reset: undefined,
      })
    })

    it('should handle edge case with zero remaining requests but success true', async () => {
      const mockResult = {
        success: true,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000,
      }
      mockLimit.mockResolvedValue(mockResult)

      const result = await checkRateLimit(rateLimiters.consent, '192.168.1.1')

      expect(result.success).toBe(true)
      expect(typeof result.reset).toBe('number')
    })
  })
})