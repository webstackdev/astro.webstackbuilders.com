/**
 * Cron endpoint regression tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { APIRoute } from 'astro'
import { GET as cleanupDsar } from '@pages/api/cron/cleanup-dsar-requests'
import { GET as cleanupConfirmations } from '@pages/api/cron/cleanup-confirmations'
import { GET as pingIntegrations } from '@pages/api/cron/ping-integrations'

const supabaseAdminMock = vi.hoisted(() => ({
  from: vi.fn(),
}))

const getCronSecretMock = vi.hoisted(() => vi.fn(() => 'cron-secret'))
const getUpstashApiUrlMock = vi.hoisted(() => vi.fn(() => 'https://example.upstash.io'))
const getUpstashApiTokenMock = vi.hoisted(() => vi.fn(() => 'upstash-token'))

vi.mock('@pages/api/_utils', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@pages/api/_environment/environmentApi', async () => {
  const actual = await vi.importActual<typeof import('@pages/api/_environment/environmentApi')>(
    '@pages/api/_environment/environmentApi',
  )
  return {
    ...actual,
    getCronSecret: getCronSecretMock,
    getUpstashApiUrl: getUpstashApiUrlMock,
    getUpstashApiToken: getUpstashApiTokenMock,
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
  delete: () => DeleteChain
  not: () => DeleteChain
  lt: () => DeleteChain
  is: () => DeleteChain
  select: () => Promise<{ data?: unknown[]; error?: unknown }>
}

const createDeleteChain = (options?: { data?: unknown[]; error?: unknown }): DeleteChain => {
  const chain: DeleteChain = {
    delete: () => chain,
    not: () => chain,
    lt: () => chain,
    is: () => chain,
    select: () =>
      Promise.resolve({
        data: options?.data ?? [],
        error: options?.error ?? null,
      }),
  }

  return chain
}

type SelectChain = {
  select: (..._args: unknown[]) => SelectChain
  limit: (..._args: unknown[]) => Promise<{ data?: unknown[]; error?: unknown; count?: number }>
}

const createSelectChain = (options?: {
  data?: unknown[]
  error?: unknown
  count?: number
}): SelectChain => {
  const response = {
    data: options?.data ?? [],
    error: options?.error ?? null,
    count: options?.count ?? options?.data?.length ?? 0,
  }

  const chain: SelectChain = {
    select: () => chain,
    limit: () => Promise.resolve({ ...response }),
  }

  return chain
}

describe('Cron cleanup endpoints', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    supabaseAdminMock.from.mockReset()
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
      expect(supabaseAdminMock.from).not.toHaveBeenCalled()
    })

    it('summarizes deletions when supabase succeeds', async () => {
      supabaseAdminMock.from
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
      expect(supabaseAdminMock.from).toHaveBeenCalledTimes(2)
    })

    it('returns 500 when removing fulfilled requests fails', async () => {
      supabaseAdminMock.from
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
      supabaseAdminMock.from
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

    it('surfaces supabase errors for old confirmations', async () => {
      supabaseAdminMock.from
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

  describe('ping-integrations', () => {
    const run = (request: Request) =>
      pingIntegrations(buildContext(request) as unknown as Parameters<APIRoute>[0])

    let fetchMock: ReturnType<typeof vi.fn>

    const buildRequest = (headers?: HeadersInit) => {
      const init: RequestInit = { method: 'GET' }
      if (typeof headers !== 'undefined') {
        init.headers = headers
      }
      return new Request('http://localhost/api/cron/ping-integrations', init)
    }

    const createFetchResponse = (overrides?: Partial<Response>): Response => ({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ result: null }),
      text: vi.fn().mockResolvedValue(''),
      headers: new Headers(),
      redirected: false,
      statusText: 'OK',
      type: 'basic',
      url: getUpstashApiUrlMock(),
      clone: vi.fn(() => createFetchResponse(overrides)),
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      ...overrides,
    }) as unknown as Response

    beforeEach(() => {
      fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('rejects requests without valid secret', async () => {
      const response = await run(buildRequest())
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error.code).toBe('UNAUTHORIZED')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('pings Upstash and Supabase once authorized', async () => {
      fetchMock.mockResolvedValue(createFetchResponse())
      supabaseAdminMock.from.mockReturnValueOnce(createSelectChain({ count: 5 }))

      const response = await run(
        buildRequest({
          authorization: 'Bearer cron-secret',
        }),
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(typeof body.upstash.durationMs).toBe('number')
      expect(body.supabase.rowsChecked).toBe(5)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const fetchArgs = fetchMock.mock.calls[0]![1] as RequestInit | undefined
      const headers = fetchArgs?.headers as Record<string, string> | undefined
      expect(headers?.['Authorization'] ?? headers?.['authorization']).toBe('Bearer upstash-token')
    })

    it('returns upstream error details when Upstash responds with failure', async () => {
      fetchMock.mockResolvedValue(
        createFetchResponse({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: vi.fn().mockResolvedValue({ error: 'unavailable' }),
        }),
      )
      supabaseAdminMock.from.mockReturnValueOnce(createSelectChain())

      const response = await run(
        buildRequest({
          authorization: 'Bearer cron-secret',
        }),
      )
      const body = await response.json()

      expect(response.status).toBe(503)
      expect(body.error.code).toBe('CRON_UPSTASH_PING_FAILED')
    })

    it('surfaces Supabase errors when ping fails', async () => {
      fetchMock.mockResolvedValue(createFetchResponse())
      supabaseAdminMock.from.mockReturnValueOnce(
        createSelectChain({ error: { message: 'boom' } }),
      )

      const response = await run(
        buildRequest({
          authorization: 'Bearer cron-secret',
        }),
      )
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error.code).toBe('CRON_SUPABASE_PING_FAILED')
    })
  })
})
