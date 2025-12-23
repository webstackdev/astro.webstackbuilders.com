import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { APIRoute } from 'astro'
import { GET as runAll } from '@pages/api/cron/run-all'

const getCronSecretMock = vi.hoisted(() => vi.fn(() => 'cron-secret'))
const getSiteUrlMock = vi.hoisted(() => vi.fn(() => 'https://example.com'))

vi.mock('@pages/api/_environment/environmentApi', async () => {
  const actual = await vi.importActual<typeof import('@pages/api/_utils/environment/environmentApi')>(
    '@pages/api/_environment/environmentApi',
  )
  return {
    ...actual,
    getCronSecret: getCronSecretMock,
    getSiteUrl: getSiteUrlMock,
  }
})

const buildContext = (request: Request) => ({
  request,
  clientAddress: '127.0.0.1',
  cookies: {
    get: () => undefined,
  },
})

describe('cron runner', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  const run = (request: Request) => runAll(buildContext(request) as unknown as Parameters<APIRoute>[0])

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    warnSpy.mockRestore()
  })

  const createResponse = (path: string, overrides?: Partial<Response>) =>
    ({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'x-vercel-elapsed-time': '123' }),
      json: vi.fn().mockResolvedValue({ path }),
      text: vi.fn().mockResolvedValue(''),
      ...overrides,
    }) as unknown as Response

  it('rejects unauthorized requests', async () => {
    const request = new Request('https://example.com/api/cron/run-all')
    const response = await run(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('calls downstream cron endpoints', async () => {
    fetchMock
      .mockResolvedValueOnce(createResponse('/api/cron/cleanup-confirmations'))
      .mockResolvedValueOnce(createResponse('/api/cron/cleanup-dsar-requests'))

    const request = new Request('https://example.com/api/cron/run-all', {
      method: 'GET',
      headers: {
        authorization: 'Bearer cron-secret',
      },
    })

    const response = await run(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(body.results)).toBe(true)
    expect(body.results).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const headersUsed = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headersUsed['Authorization'] ?? headersUsed['authorization']).toBe('Bearer cron-secret')
  })

  it('surfaces downstream failure details', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse('/api/cron/cleanup-confirmations', {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers(),
        }),
      )
      .mockResolvedValueOnce(createResponse('/api/cron/cleanup-dsar-requests'))

    const request = new Request('https://example.com/api/cron/run-all', {
      method: 'GET',
      headers: {
        authorization: 'Bearer cron-secret',
      },
    })

    const response = await run(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('CRON_RUNNER_TARGET_FAILED')
    expect(body.error.message).toBe('Cron runner failed to execute downstream jobs')
  })
})
