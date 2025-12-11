/**
 * Helper utilities for interacting with local WireMock instances that back the e2e API tests.
 * These utilities provide a minimal client for clearing request logs and asserting that specific
 * outbound calls were made by the server under test.
 */

import { buildWiremockBaseUrl, type WiremockService } from './wiremockConfig'

export interface WiremockLoggedRequest {
  id: string
  request: {
    url: string
    absoluteUrl: string
    method: string
    body?: string
    headers?: Record<string, { values: string[] }>
  }
  responseDefinition?: {
    status?: number
  }
  response?: {
    status?: number
  }
  wasMatched?: boolean
  loggedDate?: number
  loggedDateString?: string
}

interface WiremockListResponse {
  requests: WiremockLoggedRequest[]
}

export interface RequestMatchOptions {
  method?: string
  urlPath?: string
  urlContains?: string
  bodyIncludes?: string | string[]
}

interface WaitOptions {
  timeoutMs?: number
  intervalMs?: number
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const ensureOk = async (response: Response, serviceName: string, action: string) => {
  if (!response.ok) {
    const body = await response.text().catch(() => 'Unable to read body')
    throw new Error(`Failed to ${action} for ${serviceName} mock (status ${response.status}): ${body}`)
  }
}

export class WiremockClient {
  private readonly baseUrl: string

  constructor(private readonly serviceName: WiremockService) {
    this.baseUrl = buildWiremockBaseUrl(serviceName)
  }

  private get requestsUrl() {
    return `${this.baseUrl}/__admin/requests`
  }

  /**
   * Clears recorded requests for the service to keep assertions deterministic between tests.
   */
  async resetRequests() {
    const response = await fetch(this.requestsUrl, { method: 'DELETE' })
    await ensureOk(response, this.serviceName, 'reset requests')
  }

  private async listRequests(): Promise<WiremockLoggedRequest[]> {
    const response = await fetch(this.requestsUrl)
    await ensureOk(response, this.serviceName, 'list requests')
    const payload = (await response.json()) as WiremockListResponse
    return payload.requests ?? []
  }

  private matches(entry: WiremockLoggedRequest, filters: RequestMatchOptions) {
    if (filters.method && entry.request.method.toUpperCase() !== filters.method.toUpperCase()) {
      return false
    }
    if (filters.urlPath && entry.request.url !== filters.urlPath) {
      return false
    }
    if (filters.urlContains && !entry.request.url.includes(filters.urlContains)) {
      return false
    }
    const bodyChecks = filters.bodyIncludes
      ? Array.isArray(filters.bodyIncludes)
        ? filters.bodyIncludes
        : [filters.bodyIncludes]
      : []
    const body = entry.request.body ?? ''
    for (const check of bodyChecks) {
      if (!body.includes(check)) {
        return false
      }
    }
    return true
  }

  /**
   * Returns all requests that match the provided filters without polling.
   */
  async findRequests(filters: RequestMatchOptions) {
    const entries = await this.listRequests()
    return entries.filter((entry) => this.matches(entry, filters))
  }

  /**
   * Waits until a matching request is present or times out.
   */
  async expectRequest(filters: RequestMatchOptions, options: WaitOptions = {}) {
    const timeoutMs = options.timeoutMs ?? 4000
    const intervalMs = options.intervalMs ?? 125
    const start = Date.now()
    let attempts = 0
    while (Date.now() - start <= timeoutMs) {
      attempts += 1
      const matches = await this.findRequests(filters)
      if (matches.length > 0) {
        return matches[matches.length - 1]
      }
      await delay(intervalMs)
    }
    throw new Error(
      `Expected ${this.serviceName} mock to receive a matching request within ${timeoutMs}ms (attempts=${attempts}).`
    )
  }
}

export const wiremock = {
  convertkit: new WiremockClient('convertkit'),
  resend: new WiremockClient('resend'),
}
