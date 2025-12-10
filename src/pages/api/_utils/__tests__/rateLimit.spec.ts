import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { TestError } from '@test/errors'

type MockWindow = {
  id: string
  scope: string
  identifier: string
  hits: number
  limit: number
  windowMs: number
  windowExpiresAt: number
  updatedAt: Date
}

type WindowState = {
  current: MockWindow | undefined
  resetWindow: ReturnType<typeof vi.fn>
  incrementHits: ReturnType<typeof vi.fn>
}

const {
  mockIsDev,
  mockIsTest,
  mockIsDbError,
  mockWithRateLimitWindow,
} = vi.hoisted(() => ({
  mockIsDev: vi.fn(() => false),
  mockIsTest: vi.fn(() => false),
  mockIsDbError: vi.fn(() => false),
  mockWithRateLimitWindow: vi.fn(),
}))

const windowStates = new Map<string, WindowState>()

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
  isDev: mockIsDev,
  isTest: mockIsTest,
}))

vi.mock('astro:db', () => ({
  isDbError: mockIsDbError,
}))

vi.mock('@pages/api/_utils/rateLimitStore', () => ({
  withRateLimitWindow: mockWithRateLimitWindow,
}))

import { rateLimiters, checkRateLimit, checkContactRateLimit } from '@pages/api/_utils/rateLimit'

function buildWindow(scope: string, identifier: string, overrides?: Partial<MockWindow>): MockWindow {
  return {
    id: overrides?.id ?? `${scope}-${identifier}`,
    scope,
    identifier,
    hits: overrides?.hits ?? 0,
    limit: overrides?.limit ?? 10,
    windowMs: overrides?.windowMs ?? 60_000,
    windowExpiresAt: overrides?.windowExpiresAt ?? Date.now() + 60_000,
    updatedAt: overrides?.updatedAt ?? new Date(),
  }
}

function createWindowState(scope: string, identifier: string, initial?: MockWindow): WindowState {
  const state: WindowState = {
    current: initial,
    resetWindow: vi.fn(async ({ hits, limit, windowMs, windowExpiresAt }) => {
      state.current = buildWindow(scope, identifier, {
        hits,
        limit,
        windowMs,
        windowExpiresAt,
      })
      return state.current
    }),
    incrementHits: vi.fn(async () => {
      if (!state.current) {
        throw new TestError('Rate limit window missing')
      }
      state.current = {
        ...state.current,
        hits: state.current.hits + 1,
        updatedAt: new Date(),
      }
      return state.current
    }),
  }
  return state
}

function ensureWindowState(scope: string, identifier: string): WindowState {
  const key = `${scope}:${identifier}`
  if (!windowStates.has(key)) {
    windowStates.set(key, createWindowState(scope, identifier))
  }
  return windowStates.get(key) as WindowState
}

function seedWindow(scope: string, identifier: string, overrides?: Partial<MockWindow>): WindowState {
  const state = createWindowState(scope, identifier, buildWindow(scope, identifier, overrides))
  windowStates.set(`${scope}:${identifier}`, state)
  return state
}

describe('Rate Limit Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    windowStates.clear()
    mockIsDev.mockReturnValue(false)
    mockIsTest.mockReturnValue(false)
    mockIsDbError.mockReturnValue(false)
    mockWithRateLimitWindow.mockImplementation(async (scope, identifier, handler) => {
      const state = ensureWindowState(scope as string, identifier)
      return handler({
        window: state.current,
        resetWindow: state.resetWindow,
        incrementHits: state.incrementHits,
      })
    })
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
    it('should return success when rate limit is not exceeded', async () => {
      const result = await checkRateLimit(rateLimiters.consent, '192.168.1.1')

      const state = ensureWindowState('consent', '192.168.1.1')
      expect(state.resetWindow).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(true)
      expect(typeof result.reset).toBe('number')
    })

    it('should return failure when rate limit is exceeded', async () => {
      seedWindow('consent', '192.168.1.1', {
        hits: 10,
        limit: 10,
        windowExpiresAt: Date.now() + 60000,
      })
      const result = await checkRateLimit(rateLimiters.consent, '192.168.1.1')

      const state = ensureWindowState('consent', '192.168.1.1')
      expect(state.incrementHits).not.toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(typeof result.reset).toBe('number')
    })

    it('should handle different identifiers', async () => {
      await checkRateLimit(rateLimiters.export, 'user@example.com')
      expect(mockWithRateLimitWindow).toHaveBeenCalledWith('export', 'user@example.com', expect.any(Function))

      await checkRateLimit(rateLimiters.export, '10.0.0.1')
      expect(mockWithRateLimitWindow).toHaveBeenCalledWith('export', '10.0.0.1', expect.any(Function))
    })

    it('should propagate rate limiter errors', async () => {
      const error = new TestError('DB offline')
      mockWithRateLimitWindow.mockRejectedValueOnce(error)

      await expect(
        checkRateLimit(rateLimiters.consent, '192.168.1.1')
      ).rejects.toThrow('DB offline')
    })

    it('should work with different rate limiter configurations', async () => {
      seedWindow('consent', 'test-ip', {
        hits: 0,
        limit: 10,
        windowExpiresAt: Date.now() + 60000,
      })
      let result = await checkRateLimit(rateLimiters.consent, 'test-ip')
      expect(result.success).toBe(true)

      seedWindow('consentRead', 'test-ip', {
        hits: 0,
        limit: 30,
        windowExpiresAt: Date.now() + 60000,
      })
      result = await checkRateLimit(rateLimiters.consentRead, 'test-ip')
      expect(result.success).toBe(true)

      seedWindow('export', 'test-ip', {
        hits: 5,
        limit: 5,
        windowExpiresAt: Date.now() + 60000,
      })
      result = await checkRateLimit(rateLimiters.export, 'test-ip')
      expect(result.success).toBe(false)
    })

    it('should return fallback response on database errors', async () => {
      mockIsDbError.mockReturnValue(true)
      mockWithRateLimitWindow.mockRejectedValueOnce(new Error('db failure'))

      const result = await checkRateLimit(rateLimiters.consent, '192.168.1.1')

      expect(result.success).toBe(false)
      expect(typeof result.reset).toBe('number')
    })
  })

  describe('checkContactRateLimit', () => {
    let isDev: ReturnType<typeof vi.fn>
    let isTest: ReturnType<typeof vi.fn>

    beforeEach(() => {
      isDev = mockIsDev
      isTest = mockIsTest
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