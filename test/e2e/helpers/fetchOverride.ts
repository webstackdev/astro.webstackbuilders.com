import type { Page, Route, Request } from '@playwright/test'

export interface FetchOverrideHandle {
  restore: () => Promise<void>
  getCallCount: () => Promise<number>
  waitForCall: (_timeout?: number) => Promise<void>
}

interface BaseOverrideOptions {
  endpoint: string
  key?: string
}

interface SpyOverrideOptions extends BaseOverrideOptions {
  mode: 'spy'
}

interface HeaderOverrideOptions extends BaseOverrideOptions {
  mode: 'injectHeaders'
  headers: Record<string, string>
}

interface MockResponseOverrideOptions extends BaseOverrideOptions {
  mode: 'mockResponse'
  status?: number
  body?: unknown
  headers?: Record<string, string>
  responseBuilder?: 'echoRequestJson' | 'consentRecord'
}

interface DelayOverrideOptions extends BaseOverrideOptions {
  mode: 'delay'
  delayMs: number
}

type OverrideOptions =
  | SpyOverrideOptions
  | HeaderOverrideOptions
  | MockResponseOverrideOptions
  | DelayOverrideOptions

const generateOverrideKey = (): string => `fetch-override-${Date.now()}-${Math.random().toString(16).slice(2)}`

const delay = async (delayMs: number): Promise<void> => {
  await new Promise<void>(resolve => setTimeout(resolve, delayMs))
}

const withTimeout = async (promise: Promise<void>, timeoutMs: number, timeoutMessage: string): Promise<void> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<void>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  })

  try {
    await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

const getRoutePattern = (endpoint: string): string => {
  if (endpoint.includes('*')) {
    return endpoint
  }

  // Match both absolute and relative URLs.
  return `**${endpoint}**`
}

const safePostDataJson = (request: Request): unknown => {
  try {
    return request.postDataJSON()
  } catch {
    return null
  }
}

const buildMockResponseBody = async (
  request: Request,
  config: MockResponseOverrideOptions,
): Promise<unknown> => {
  if (config.responseBuilder === 'echoRequestJson') {
    const json = safePostDataJson(request)
    return json ?? config.body ?? {}
  }

  if (config.responseBuilder === 'consentRecord') {
    const payloadSource = safePostDataJson(request)
    const payload = (payloadSource && typeof payloadSource === 'object') ? (payloadSource as Record<string, unknown>) : {}

    const purposesSource = payload['purposes']
    const purposes = Array.isArray(purposesSource) ? purposesSource : []

    return {
      success: true,
      record: {
        id: 'test-consent-record',
        DataSubjectId: typeof payload['DataSubjectId'] === 'string' ? payload['DataSubjectId'] : 'test-subject-id',
        purposes,
        timestamp: new Date().toISOString(),
        source: typeof payload['source'] === 'string' ? payload['source'] : 'cookies_modal',
        userAgent: typeof payload['userAgent'] === 'string' ? payload['userAgent'] : 'playwright-test',
        ipAddress: '127.0.0.1',
        privacyPolicyVersion: 'test-policy-v1',
        verified: Boolean(payload['verified']),
      },
    }
  }

  return config.body ?? {}
}

const createFetchOverride = async (page: Page, options: OverrideOptions): Promise<FetchOverrideHandle> => {
  const key = options.key ?? generateOverrideKey()
  const urlPattern = getRoutePattern(options.endpoint)

  let callCount = 0
  let resolveFirstCall: (() => void) | null = null
  const firstCallPromise = new Promise<void>(resolve => {
    resolveFirstCall = resolve
  })

  const handler = async (route: Route, request: Request) => {
    callCount += 1
    if (resolveFirstCall) {
      resolveFirstCall()
      resolveFirstCall = null
    }

    if (options.mode === 'spy') {
      await route.continue()
      return
    }

    if (options.mode === 'delay') {
      await delay(options.delayMs)
      await route.continue()
      return
    }

    if (options.mode === 'injectHeaders') {
      const mergedHeaders = {
        ...request.headers(),
        ...options.headers,
      }
      await route.continue({ headers: mergedHeaders })
      return
    }

    if (options.mode === 'mockResponse') {
      const resolvedBody = await buildMockResponseBody(request, options)
      const headers: Record<string, string> = { ...(options.headers ?? {}) }

      if (!Object.keys(headers).some((headerName) => headerName.toLowerCase() === 'content-type')) {
        headers['Content-Type'] = typeof resolvedBody === 'string' ? 'text/plain' : 'application/json'
      }

      const body = typeof resolvedBody === 'string' ? resolvedBody : JSON.stringify(resolvedBody)

      await route.fulfill({
        status: options.status ?? 200,
        headers,
        body,
      })
      return
    }

    await route.continue()
  }

  await page.route(urlPattern, handler)

  const restore = async () => {
    try {
      await page.unroute(urlPattern, handler)
    } catch {
      // Ignore - page might already be closed.
    }
  }

  const getCallCount = async () => callCount

  const waitForCall = async (timeout = 5000) => {
    if (callCount > 0) {
      return
    }

    await withTimeout(firstCallPromise, timeout, `Timed out waiting for request match: ${urlPattern} (${key})`)
  }

  return { restore, getCallCount, waitForCall }
}

export const spyOnFetchEndpoint = async (page: Page, endpoint: string): Promise<FetchOverrideHandle> => {
  return await createFetchOverride(page, { mode: 'spy', endpoint })
}

export const injectHeadersIntoFetch = async (
  page: Page,
  options: { endpoint: string; headers: Record<string, string> },
): Promise<FetchOverrideHandle> => {
  return await createFetchOverride(page, { mode: 'injectHeaders', ...options })
}

export const mockFetchEndpointResponse = async (
  page: Page,
  options: { endpoint: string; status?: number; body?: unknown; headers?: Record<string, string>; responseBuilder?: 'echoRequestJson' | 'consentRecord' },
): Promise<FetchOverrideHandle> => {
  return await createFetchOverride(page, { mode: 'mockResponse', ...options })
}

export const delayFetchForEndpoint = async (
  page: Page,
  options: { endpoint: string; delayMs: number },
): Promise<FetchOverrideHandle> => {
  return await createFetchOverride(page, { mode: 'delay', ...options })
}
