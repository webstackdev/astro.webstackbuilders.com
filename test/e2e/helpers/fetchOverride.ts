import type { Page } from '@playwright/test'

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

const createFetchOverride = async (page: Page, options: OverrideOptions): Promise<FetchOverrideHandle> => {
  const key = options.key ?? generateOverrideKey()

  await page.evaluate(({ config }) => {
    const globalWindow = window as typeof window & {
      __fetchOverrideStack?: Array<typeof window.fetch>
      __fetchOverrideCallCounts?: Record<string, number>
    }

    const getRequestUrl = (input: RequestInfo | URL): string => {
      if (typeof input === 'string') {
        return input
      }
      if (input instanceof Request) {
        return input.url
      }
      if (input instanceof URL) {
        return input.href
      }
      return String(input)
    }

    const ensureStateInitialized = () => {
      globalWindow.__fetchOverrideStack = globalWindow.__fetchOverrideStack ?? []
      globalWindow.__fetchOverrideCallCounts = globalWindow.__fetchOverrideCallCounts ?? {}
    }

    ensureStateInitialized()

    const previousFetch = window.fetch
    globalWindow.__fetchOverrideStack!.push(previousFetch)

    window.fetch = async (...args) => {
      const [input, init] = args
      const url = getRequestUrl(input)

      if (!url.includes(config.endpoint)) {
        return previousFetch(...args)
      }

      globalWindow.__fetchOverrideCallCounts![config.key] =
        (globalWindow.__fetchOverrideCallCounts![config.key] ?? 0) + 1

      if (config.mode === 'spy') {
        return previousFetch(...args)
      }

      if (config.mode === 'delay') {
        await new Promise(resolve => setTimeout(resolve, config.delayMs))
        return previousFetch(...args)
      }

      const request = input instanceof Request ? input : new Request(input, init)

      if (config.mode === 'injectHeaders') {
        const mergedHeaders = new Headers(request.headers)
        Object.entries(config.headers).forEach(([headerName, headerValue]) => {
          mergedHeaders.set(headerName, headerValue)
        })
        const overriddenRequest = new Request(request, { headers: mergedHeaders })
        return previousFetch(overriddenRequest)
      }

      if (config.mode === 'mockResponse') {
        const headers = new Headers(config.headers ?? {})
        const buildResponseBody = async (): Promise<unknown> => {
          if (config.responseBuilder === 'echoRequestJson') {
            try {
              return await request.clone().json()
            } catch {
              return config.body ?? {}
            }
          }

          if (config.responseBuilder === 'consentRecord') {
            let payload: Record<string, unknown> = {}
            try {
              payload = await request.clone().json()
            } catch {
              payload = {}
            }

            const purposesSource = (payload as Record<string, unknown>)['purposes']
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

        const resolvedBody = await buildResponseBody()
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', typeof resolvedBody === 'string' ? 'text/plain' : 'application/json')
        }

        const serializedBody = typeof resolvedBody === 'string' ? resolvedBody : JSON.stringify(resolvedBody)

        return new Response(serializedBody, {
          status: config.status ?? 200,
          headers,
        })
      }

      return previousFetch(...args)
    }
  }, { config: { ...options, key } })

  const restore = async () => {
    await page.evaluate(({ overrideKey }) => {
      const globalWindow = window as typeof window & {
        __fetchOverrideStack?: Array<typeof window.fetch>
        __fetchOverrideCallCounts?: Record<string, number>
      }

      if (globalWindow.__fetchOverrideStack && globalWindow.__fetchOverrideStack.length > 0) {
        const previousFetch = globalWindow.__fetchOverrideStack.pop()
        if (previousFetch) {
          window.fetch = previousFetch
        }
      }

      if (globalWindow.__fetchOverrideCallCounts) {
        delete globalWindow.__fetchOverrideCallCounts[overrideKey]
      }
    }, { overrideKey: key })
  }

  const getCallCount = async () => {
    return await page.evaluate(({ overrideKey }) => {
      const globalWindow = window as typeof window & {
        __fetchOverrideCallCounts?: Record<string, number>
      }
      return globalWindow.__fetchOverrideCallCounts?.[overrideKey] ?? 0
    }, { overrideKey: key })
  }

  const waitForCall = async (timeout = 5000) => {
    await page.waitForFunction(
      (overrideKey) => {
        const globalWindow = window as typeof window & {
          __fetchOverrideCallCounts?: Record<string, number>
        }
        return (globalWindow.__fetchOverrideCallCounts?.[overrideKey] ?? 0) > 0
      },
      key,
      { timeout },
    )
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
