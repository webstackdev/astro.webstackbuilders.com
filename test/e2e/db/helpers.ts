import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { getLibsqlClient } from './libsqlClient'

const toIso = (value: Date | number | string): string => {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString()
}

const parseJsonArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value as string[]
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export interface ConsentRecordRow {
  id: string
  dataSubjectId: string
  purposes: string[]
  source: string
  createdAt: string
}

export const waitForConsentRecord = async (
  dataSubjectId: string,
  expectedPurposes: string[],
  timeoutMs = 7000,
): Promise<ConsentRecordRow> => {
  const libsql = getLibsqlClient()
  const deadline = Date.now() + timeoutMs
  let lastError: string | null = null

  while (Date.now() <= deadline) {
    try {
      const result = await libsql.execute({
        sql: `SELECT id, dataSubjectId, purposes, source, createdAt FROM consentEvents WHERE dataSubjectId = ? ORDER BY createdAt DESC LIMIT 1`,
        args: [dataSubjectId],
      })
      const row = result.rows[0]
      if (row) {
        const purposes = parseJsonArray(row['purposes'])
        const hasAll = expectedPurposes.every((purpose) => purposes.includes(purpose))
        if (hasAll) {
          return {
            id: String(row['id']),
            dataSubjectId: String(row['dataSubjectId']),
            purposes,
            source: String(row['source'] ?? 'unknown'),
            createdAt: String(row['createdAt']),
          }
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }

    await delay(250)
  }

  throw new Error(lastError ?? `Timed out waiting for consent record ${dataSubjectId}`)
}

export const markNewsletterTokenExpired = async (token: string, expiredAt?: Date) => {
  const libsql = getLibsqlClient()
  const timestamp = toIso(expiredAt ?? new Date(Date.now() - 60 * 60 * 1000))
  const result = await libsql.execute({
    sql: `UPDATE newsletterConfirmations SET expiresAt = ? WHERE token = ?`,
    args: [timestamp, token],
  })

  if (!result.rowsAffected) {
    throw new Error(`Unable to mark newsletter token ${token} as expired; no matching rows found`)
  }
}

export const findLatestNewsletterConfirmationTokenByEmail = async (email: string): Promise<string | null> => {
  const libsql = getLibsqlClient()
  const result = await libsql.execute({
    sql: `SELECT token FROM newsletterConfirmations WHERE email = ? ORDER BY createdAt DESC LIMIT 1`,
    args: [email],
  })
  const row = result.rows[0]
  if (!row) {
    return null
  }
  const token = row['token']
  return token ? String(token) : null
}

export const waitForLatestNewsletterConfirmationTokenByEmail = async (
  email: string,
  timeoutMs = 7000,
): Promise<string> => {
  const deadline = Date.now() + timeoutMs
  let lastError: string | null = null

  while (Date.now() <= deadline) {
    try {
      const token = await findLatestNewsletterConfirmationTokenByEmail(email)
      if (token) {
        return token
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }

    await delay(250)
  }

  throw new Error(lastError ?? `Timed out waiting for newsletter token for ${email}`)
}

export interface NewsletterConfirmationSeed {
  email?: string
  dataSubjectId?: string
  token?: string
  expiresAt: Date
  confirmedAt?: Date | null
  createdAt?: Date
}

export const insertNewsletterConfirmation = async (
  seed: NewsletterConfirmationSeed,
): Promise<{ id: string; token: string; email: string }> => {
  const libsql = getLibsqlClient()
  const id = randomUUID()
  const token = seed.token ?? `cron-newsletter-${randomUUID()}`
  const email = seed.email ?? `cron-newsletter-${Date.now()}@example.com`
  const dataSubjectId = seed.dataSubjectId ?? randomUUID()
  const createdAt = seed.createdAt ?? new Date()
  const consentTimestamp = createdAt

  await libsql.execute({
    sql: `INSERT INTO newsletterConfirmations (id, token, email, dataSubjectId, firstName, source, userAgent, ipAddress, consentTimestamp, expiresAt, confirmedAt, createdAt)
          VALUES (?, ?, ?, ?, NULL, 'cron_test', 'playwright', NULL, ?, ?, ?, ?)`,
    args: [
      id,
      token,
      email,
      dataSubjectId,
      toIso(consentTimestamp),
      toIso(seed.expiresAt),
      seed.confirmedAt ? toIso(seed.confirmedAt) : null,
      toIso(createdAt),
    ],
  })

  return { id, token, email }
}

export interface DsarRequestSeed {
  requestType?: string
  email?: string
  token?: string
  expiresAt?: Date
  fulfilledAt?: Date | null
  createdAt?: Date
}

export const insertDsarRequest = async (
  seed: DsarRequestSeed,
): Promise<{ id: string; token: string }> => {
  const libsql = getLibsqlClient()
  const id = randomUUID()
  const token = seed.token ?? `cron-dsar-${randomUUID()}`
  const email = seed.email ?? `cron-dsar-${Date.now()}@example.com`
  const expiresAt = seed.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000)
  const createdAt = seed.createdAt ?? new Date()
  const requestType = seed.requestType ?? 'DELETE'

  await libsql.execute({
    sql: `INSERT INTO dsarRequests (id, token, email, requestType, expiresAt, fulfilledAt, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      token,
      email,
      requestType,
      toIso(expiresAt),
      seed.fulfilledAt ? toIso(seed.fulfilledAt) : null,
      toIso(createdAt),
    ],
  })

  return { id, token }
}

export const findNewsletterConfirmationById = async (id: string) => {
  const libsql = getLibsqlClient()
  const result = await libsql.execute({
    sql: `SELECT id FROM newsletterConfirmations WHERE id = ? LIMIT 1`,
    args: [id],
  })
  return result.rows[0] ?? null
}

export const findDsarRequestById = async (id: string) => {
  const libsql = getLibsqlClient()
  const result = await libsql.execute({
    sql: `SELECT id FROM dsarRequests WHERE id = ? LIMIT 1`,
    args: [id],
  })
  return result.rows[0] ?? null
}

export const deleteNewsletterConfirmationById = async (id: string) => {
  const libsql = getLibsqlClient()
  await libsql.execute({
    sql: `DELETE FROM newsletterConfirmations WHERE id = ?`,
    args: [id],
  })
}

export const deleteDsarRequestById = async (id: string) => {
  const libsql = getLibsqlClient()
  await libsql.execute({
    sql: `DELETE FROM dsarRequests WHERE id = ?`,
    args: [id],
  })
}

export const deleteConsentRecordsBySubjectId = async (dataSubjectId: string) => {
  const libsql = getLibsqlClient()
  await libsql.execute({
    sql: `DELETE FROM consentEvents WHERE dataSubjectId = ?`,
    args: [dataSubjectId],
  })
}
