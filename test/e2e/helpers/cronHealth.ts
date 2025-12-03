import { setTimeout as delay } from 'node:timers/promises'

interface RetryOptions {
  retries?: number
  delayMs?: number
  timeoutMs?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  retries: 5,
  delayMs: 1000,
  timeoutMs: 4000,
}

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

const withRetries = async (action: () => Promise<void>, label: string, options?: RetryOptions) => {
  const { retries, delayMs, timeoutMs } = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await action()
      return
    } catch (error) {
      lastError = error
      if (attempt === retries) {
        break
      }
      await delay(delayMs)
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError)
  throw new Error(`${label} health check failed after ${retries} attempts (${timeoutMs}ms timeout): ${message}`)
}

const buildSupabaseHealthUrl = (baseUrl: string) => new URL('/rest/v1/?select=1', baseUrl).toString()
const buildUpstashCommandUrl = (baseUrl: string) => new URL('/', baseUrl).toString()

const ensureSupabaseReady = async (supabaseUrl: string, serviceRoleKey: string, options?: RetryOptions) => {
  const healthUrl = buildSupabaseHealthUrl(supabaseUrl)
  await withRetries(
    async () => {
      const response = await fetchWithTimeout(
        healthUrl,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        },
        options?.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs
      )

      if (!response.ok) {
        throw new Error(`Supabase responded with status ${response.status}`)
      }
    },
    'Supabase REST API',
    options
  )
}

const ensureUpstashReady = async (upstashUrl: string, upstashToken: string, options?: RetryOptions) => {
  const commandUrl = buildUpstashCommandUrl(upstashUrl)
  await withRetries(
    async () => {
      const response = await fetchWithTimeout(
        commandUrl,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${upstashToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(['PING']),
        },
        options?.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs
      )

      if (!response.ok) {
        throw new Error(`Upstash responded with status ${response.status}`)
      }
    },
    'Upstash REST API',
    options
  )
}

export interface CronDependencyConfig extends RetryOptions {
  supabaseUrl: string
  supabaseServiceKey: string
  upstashUrl: string
  upstashToken: string
}

export async function ensureCronDependenciesHealthy({
  supabaseUrl,
  supabaseServiceKey,
  upstashUrl,
  upstashToken,
  ...options
}: CronDependencyConfig): Promise<void> {
  await Promise.all([
    ensureSupabaseReady(supabaseUrl, supabaseServiceKey, options),
    ensureUpstashReady(upstashUrl, upstashToken, options),
  ])
}
