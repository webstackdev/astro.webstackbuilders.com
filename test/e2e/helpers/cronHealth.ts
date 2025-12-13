import { setTimeout as delay } from 'node:timers/promises'
import { getLibsqlClient } from '@test/e2e/db/libsqlClient'

interface RetryOptions {
  retries?: number
  delayMs?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  retries: 5,
  delayMs: 250,
}

export async function ensureCronDependenciesHealthy(options?: RetryOptions): Promise<void> {
  const { retries, delayMs } = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown
  const libsql = getLibsqlClient()

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await libsql.execute('SELECT 1')
      return
    } catch (error) {
      lastError = error
      if (attempt === retries) {
        break
      }
      await delay(delayMs)
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error')
  throw new Error(`Astro DB health check failed: ${message}`)
}
