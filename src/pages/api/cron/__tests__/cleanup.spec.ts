/**
 * Cron endpoint regression tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { APIRoute } from 'astro'
import { GET as cleanupDsar } from '@pages/api/cron/cleanup-dsar-requests'
import { GET as cleanupConfirmations } from '@pages/api/cron/cleanup-confirmations'

const dbDeleteMock = vi.hoisted(() => vi.fn())
const getCronSecretMock = vi.hoisted(() => vi.fn(() => 'cron-secret'))

vi.mock('astro:db', () => ({
  db: {
    delete: dbDeleteMock,
  },
  dsarRequests: {},
  newsletterConfirmations: {},
  lt: vi.fn((...args) => ({ op: 'lt', args })),
  gt: vi.fn((...args) => ({ op: 'gt', args })),
  isNull: vi.fn((...args) => ({ op: 'isNull', args })),
  and: vi.fn((...args) => ({ op: 'and', args })),
}))

vi.mock('@pages/api/_utils/environment', async () => {
  const actual = await vi.importActual<typeof import('@pages/api/_utils/environment')>(
    '@pages/api/_utils/environment',
  )
  return {
    ...actual,
    getCronSecret: getCronSecretMock,
  }
})

const buildContext = (request: Request) => ({
  request,
  clientAddress: '127.0.0.1',
  cookies: {
    get: () => undefined,
  },
})

type DeleteChain = {
  where: ReturnType<typeof vi.fn>
}

const createDeleteChain = (options?: { data?: unknown[]; error?: unknown }): DeleteChain => {
  const returning = () => {
    if (options?.error) {
      return Promise.reject(options.error)
    }
    return Promise.resolve(options?.data ?? [])
  }

  return {
    where: vi.fn(() => ({ returning })),
  }
}

describe('Cron cleanup endpoints', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    dbDeleteMock.mockReset()
    getCronSecretMock.mockClear()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    logSpy.mockRestore()
  })

  describe('cleanup-dsar-requests', () => {
    const run = (request: Request) =>
      cleanupDsar(buildContext(request) as unknown as Parameters<APIRoute>[0])

    it('rejects unauthorized requests', async () => {
      const request = new Request('http://localhost/api/cron/cleanup-dsar-requests', {
        method: 'GET',
      })

      const response = await run(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error.code).toBe('UNAUTHORIZED')
      expect(dbDeleteMock).not.toHaveBeenCalled()
    })

    it('summarizes deletions when astro db succeeds', async () => {
      dbDeleteMock
        .mockReturnValueOnce(createDeleteChain({ data: [{ id: 1 }, { id: 2 }] }))
        .mockReturnValueOnce(createDeleteChain({ data: [{ id: 3 }] }))

      const request = new Request('http://localhost/api/cron/cleanup-dsar-requests', {
        method: 'GET',
        headers: {
          authorization: 'Bearer cron-secret',
        },
      })

      const response = await run(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.deleted).toEqual({ fulfilled: 2, expired: 1, total: 3 })
      expect(dbDeleteMock).toHaveBeenCalledTimes(2)
    })

    it('returns 500 when removing fulfilled requests fails', async () => {
      dbDeleteMock
        .mockReturnValueOnce(createDeleteChain({ error: { message: 'boom' } }))
        .mockReturnValueOnce(createDeleteChain())

      const request = new Request('http://localhost/api/cron/cleanup-dsar-requests', {
        method: 'GET',
        headers: {
          authorization: 'Bearer cron-secret',
        },
      })

      const response = await run(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error.code).toBe('CRON_DELETE_FULFILLED_DSAR_FAILED')
    })
  })

  describe('cleanup-confirmations', () => {
    const run = (request: Request) =>
      cleanupConfirmations(buildContext(request) as unknown as Parameters<APIRoute>[0])

    it('returns 401 when CRON secret is invalid', async () => {
      const request = new Request('http://localhost/api/cron/cleanup-confirmations')
      const response = await run(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('reports counts when cleanup succeeds', async () => {
      dbDeleteMock
        .mockReturnValueOnce(createDeleteChain({ data: [{ id: 1 }, { id: 2 }] }))
        .mockReturnValueOnce(createDeleteChain({ data: [{ id: 3 }, { id: 4 }] }))

      const request = new Request('http://localhost/api/cron/cleanup-confirmations', {
        method: 'GET',
        headers: {
          authorization: 'Bearer cron-secret',
        },
      })

      const response = await run(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.deleted).toEqual({ expired: 2, oldConfirmed: 2, total: 4 })
    })

    it('surfaces astro db errors for old confirmations', async () => {
      dbDeleteMock
        .mockReturnValueOnce(createDeleteChain())
        .mockReturnValueOnce(createDeleteChain({ error: { message: 'bad' } }))

      const request = new Request('http://localhost/api/cron/cleanup-confirmations', {
        method: 'GET',
        headers: {
          authorization: 'Bearer cron-secret',
        },
      })

      const response = await run(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error.code).toBe('CRON_DELETE_CONFIRMED_TOKENS_FAILED')
    })
  })

})
