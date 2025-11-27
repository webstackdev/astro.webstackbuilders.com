import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { TestError } from '@test/errors'

const { mockIsDev, mockIsTest } = vi.hoisted(() => ({
  mockIsDev: vi.fn(() => false),
  mockIsTest: vi.fn(() => false),
}))

// Mock server environment helpers that get re-exported through environmentApi
vi.mock('@lib/config/environmentServer', () => ({
  isCI: vi.fn(() => false),
  isDev: mockIsDev,
  isE2eTest: vi.fn(() => false),
  isGitHub: vi.fn(() => false),
  isProd: vi.fn(() => true),
  isTest: mockIsTest,
  isUnitTest: vi.fn(() => false),
  isVercel: vi.fn(() => false),
}))

// Mock environment utilities BEFORE importing the module under test
vi.mock('@pages/api/_environment/environmentApi', () => ({
  getUpstashApiToken: vi.fn(() => 'test-token'),
  getUpstashApiUrl: vi.fn(() => 'https://test-redis.upstash.io'),
  isDev: mockIsDev,
  isTest: mockIsTest,
}))

import { rateLimiters, checkRateLimit, checkContactRateLimit } from '@pages/api/_utils/rateLimit'

// Mock the Upstash Redis and Ratelimit modules
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(function RedisMock(_config) {
    return {}
  }),
}))

vi.mock('@upstash/ratelimit', () => {
  const mockLimitFn = vi.fn()

  const RatelimitConstructor = vi.fn(function RatelimitMock(config) {
    return {
      limit: mockLimitFn,
      config,
    }
  })

  // Add static methods to the constructor
  Object.assign(RatelimitConstructor, {
    slidingWindow: vi.fn((requests, window) => ({ requests, window })),
    fixedWindow: vi.fn((requests, window) => ({ requests, window })),
  })

  return {
    Ratelimit: RatelimitConstructor,
  }
})

describe('Rate Limit Utils', () => {
  // Get reference to the mock function after module initialization
  let mockLimit: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Get the mock function from the created rate limiters
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')
    const rateLimiterInstance = new Ratelimit({
      redis: new Redis({
        url: 'https://test-redis.upstash.io',
        token: 'test-token',
      }),
      limiter: Ratelimit.slidingWindow(1, '1 m'),
    })
    mockLimit = rateLimiterInstance.limit as ReturnType<typeof vi.fn>

    // Reset all mocks
    vi.clearAllMocks()
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

    it('should export contact rate limiter', () => {
      expect(rateLimiters.contact).toBeDefined()
      expect(typeof rateLimiters.contact.limit).toBe('function')
    })
  })

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Create a mock rate limiter
      const mockRateLimiter = {
        limit: mockLimit,
        config: {},
      }

      // Ensure each exported limiter uses the shared mock implementation
      Object.keys(rateLimiters).forEach((key) => {
        const mapKey = key as keyof typeof rateLimiters
        Object.assign(rateLimiters[mapKey], mockRateLimiter)
      })
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
      const error = new TestError('Redis connection failed')
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

  describe('checkContactRateLimit', () => {
    let isDev: ReturnType<typeof vi.fn>
    let isTest: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      // Get the mocked functions
      const utils = await import('@lib/config/environmentServer')
      isDev = utils.isDev as ReturnType<typeof vi.fn>
      isTest = utils.isTest as ReturnType<typeof vi.fn>

      // Reset to production mode by default
      isDev.mockReturnValue(false)
      isTest.mockReturnValue(false)
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should return true when isTest() returns true', () => {
      isTest.mockReturnValue(true)

      const result = checkContactRateLimit('192.168.1.1')
      expect(result).toBe(true)
    })

    it('should return true when isDev() returns true', () => {
      isDev.mockReturnValue(true)

      const result = checkContactRateLimit('192.168.1.1')
      expect(result).toBe(true)
    })

    it('should allow requests under the limit in production', () => {
      // isDev() and isTest() return false (set in beforeEach)

      const ip = '192.168.1.2'

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const result = checkContactRateLimit(ip)
        expect(result).toBe(true)
      }
    })

    it('should block requests over the limit in production', () => {
      // isDev() and isTest() return false (set in beforeEach)

      const ip = '192.168.1.3'

      // Use up the limit (5 requests)
      for (let i = 0; i < 5; i++) {
        checkContactRateLimit(ip)
      }

      // 6th request should be blocked
      const result = checkContactRateLimit(ip)
      expect(result).toBe(false)
    })

    it('should isolate rate limits by IP address', () => {
      // isDev() and isTest() return false (set in beforeEach)

      const ip1 = '192.168.1.4'
      const ip2 = '192.168.1.5'

      // Use up limit for first IP
      for (let i = 0; i < 5; i++) {
        checkContactRateLimit(ip1)
      }

      // First IP should be blocked
      expect(checkContactRateLimit(ip1)).toBe(false)

      // Second IP should still work
      expect(checkContactRateLimit(ip2)).toBe(true)
    })
  })
})