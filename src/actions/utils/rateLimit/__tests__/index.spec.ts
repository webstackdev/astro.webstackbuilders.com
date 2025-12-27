import { describe, expect, it, vi } from 'vitest'

describe('rateLimit utilities', () => {
  it('checkRateLimit returns limiter result', async () => {
    vi.resetModules()

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => false,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow: vi.fn(),
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { checkRateLimit } = await import('..')

    const limiter = {
      limit: vi.fn(async () => ({ success: false, reset: 123 })),
    }

    await expect(checkRateLimit(limiter, 'id')).resolves.toEqual({ success: false, reset: 123 })
    expect(limiter.limit).toHaveBeenCalledWith('id')
  })

  it('rateLimiters bypass in non-prod (success, reset = now + window)', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => false,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow: vi.fn(),
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { rateLimiters } = await import('..')

    const result = await rateLimiters.export.limit('abc')

    expect(result).toEqual({
      success: true,
      reset: Date.now() + 60_000,
    })

    vi.useRealTimers()
  })

  it('prod: empty identifier is treated as allowed without hitting store', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    const withRateLimitWindow = vi.fn()

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => true,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow,
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { rateLimiters } = await import('..')

    const result = await rateLimiters.export.limit('')

    expect(result).toEqual({ success: true, reset: Date.now() + 60_000 })
    expect(withRateLimitWindow).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('prod: initializes a window when missing/expired', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    const resetWindow = vi.fn(
      async (nextWindow: {
        hits: number
        limit: number
        windowMs: number
        windowExpiresAt: number
      }) => ({
        windowExpiresAt: nextWindow.windowExpiresAt,
        hits: nextWindow.hits,
        limit: nextWindow.limit,
        windowMs: nextWindow.windowMs,
      })
    )

    const withRateLimitWindow = vi.fn(
      async (_scope: string, _identifier: string, fn: (_ctx: unknown) => unknown) =>
        fn({ window: undefined, resetWindow, incrementHits: vi.fn() })
    )

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => true,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow,
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { rateLimiters } = await import('..')

    const result = await rateLimiters.delete.limit('user-1')

    expect(withRateLimitWindow).toHaveBeenCalledWith('delete', 'user-1', expect.any(Function))
    expect(resetWindow).toHaveBeenCalledWith({
      hits: 1,
      limit: 3,
      windowMs: 60_000,
      windowExpiresAt: Date.now() + 60_000,
    })
    expect(result).toEqual({ success: true, reset: Date.now() + 60_000 })

    vi.useRealTimers()
  })

  it('prod: increments hits when under limit', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    const incrementHits = vi.fn(async () => ({
      windowExpiresAt: Date.now() + 60_000,
      hits: 2,
      limit: 5,
      windowMs: 60_000,
    }))

    const withRateLimitWindow = vi.fn(
      async (_scope: string, _identifier: string, fn: (_ctx: unknown) => unknown) =>
        fn({
          window: { windowExpiresAt: Date.now() + 60_000, hits: 1, limit: 5, windowMs: 60_000 },
          resetWindow: vi.fn(),
          incrementHits,
        })
    )

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => true,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow,
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { rateLimiters } = await import('..')

    const result = await rateLimiters.contact.limit('user-2')

    expect(result).toEqual({ success: true, reset: Date.now() + 60_000 })
    expect(incrementHits).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('prod: denies when at/over limit', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    const withRateLimitWindow = vi.fn(
      async (_scope: string, _identifier: string, fn: (_ctx: unknown) => unknown) =>
        fn({
          window: { windowExpiresAt: Date.now() + 60_000, hits: 10, limit: 10, windowMs: 60_000 },
          resetWindow: vi.fn(),
          incrementHits: vi.fn(),
        })
    )

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => true,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow,
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { rateLimiters } = await import('..')

    await expect(rateLimiters.consent.limit('user-3')).resolves.toEqual({
      success: false,
      reset: Date.now() + 60_000,
    })

    vi.useRealTimers()
  })

  it('prod: returns failure on db error', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    const dbErr = new Error('db')

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => true,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow: vi.fn(async () => {
        throw dbErr
      }),
    }))
    vi.doMock('astro:db', () => ({
      isDbError: (err: unknown) => err === dbErr,
    }))

    const { rateLimiters } = await import('..')

    const result = await rateLimiters.export.limit('user-4')

    expect(result).toEqual({ success: false, reset: Date.now() + 60_000 })

    vi.useRealTimers()
  })

  it('prod: rethrows non-db errors', async () => {
    vi.resetModules()

    const nonDbErr = new Error('boom')

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => true,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow: vi.fn(async () => {
        throw nonDbErr
      }),
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { rateLimiters } = await import('..')

    await expect(rateLimiters.export.limit('user-5')).rejects.toThrow('boom')
  })

  it('checkContactRateLimit always allows in non-prod', async () => {
    vi.resetModules()

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => false,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow: vi.fn(),
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { checkContactRateLimit } = await import('..')

    for (let i = 0; i < 20; i += 1) {
      expect(checkContactRateLimit('ip')).toBe(true)
    }
  })

  it('checkContactRateLimit enforces limits in prod', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => true,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow: vi.fn(),
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { checkContactRateLimit } = await import('..')

    for (let i = 0; i < 5; i += 1) {
      expect(checkContactRateLimit('ip-1')).toBe(true)
    }
    expect(checkContactRateLimit('ip-1')).toBe(false)

    vi.useRealTimers()
  })

  it('checkContactRateLimit resets after window passes in prod', async () => {
    vi.resetModules()
    vi.useFakeTimers()

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isProd: () => true,
    }))
    vi.doMock('@actions/utils/rateLimit/store', () => ({
      withRateLimitWindow: vi.fn(),
    }))
    vi.doMock('astro:db', () => ({
      isDbError: () => false,
    }))

    const { checkContactRateLimit } = await import('..')

    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
    for (let i = 0; i < 5; i += 1) {
      expect(checkContactRateLimit('ip-2')).toBe(true)
    }
    expect(checkContactRateLimit('ip-2')).toBe(false)

    vi.setSystemTime(new Date('2025-01-01T00:16:00.000Z'))
    expect(checkContactRateLimit('ip-2')).toBe(true)

    vi.useRealTimers()
  })
})
