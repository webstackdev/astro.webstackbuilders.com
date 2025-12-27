import { randomUUID } from 'node:crypto'
import { and, db, eq, isNull, newsletterConfirmations } from 'astro:db'
import { ActionsFunctionError } from '@actions/utils/errors/ActionsFunctionError'

export interface PendingSubscription {
  email: string
  firstName?: string | undefined
  DataSubjectId: string
  token: string
  createdAt: string
  expiresAt: string
  consentTimestamp: string
  userAgent: string
  ipAddress?: string | undefined
  verified: boolean
  source: 'newsletter_form' | 'contact_form'
}

const pendingSubscriptions = new Map<string, PendingSubscription>()

export function generateConfirmationToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Buffer.from(array)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function createPendingSubscription(data: {
  email: string
  firstName?: string
  DataSubjectId: string
  userAgent: string
  ipAddress?: string
  source: 'newsletter_form' | 'contact_form'
}): Promise<string> {
  const token = generateConfirmationToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const pending: PendingSubscription = {
    email: data.email.toLowerCase().trim(),
    ...(data.firstName && { firstName: data.firstName.trim() }),
    DataSubjectId: data.DataSubjectId,
    token,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    consentTimestamp: now.toISOString(),
    userAgent: data.userAgent,
    ...(data.ipAddress && { ipAddress: data.ipAddress }),
    verified: false,
    source: data.source,
  }

  try {
    await db.insert(newsletterConfirmations).values({
      id: randomUUID(),
      token,
      email: pending.email,
      dataSubjectId: pending.DataSubjectId,
      firstName: pending.firstName ?? null,
      source: pending.source,
      userAgent: pending.userAgent,
      ipAddress: pending.ipAddress ?? null,
      consentTimestamp: new Date(pending.consentTimestamp),
      expiresAt,
      confirmedAt: null,
      createdAt: now,
    })
  } catch (error) {
    throw new ActionsFunctionError({
      message: 'Failed to create subscription confirmation',
      cause: error,
      code: 'NEWSLETTER_TOKEN_CREATE_FAILED',
      status: 500,
      route: 'actions:newsletter',
      operation: 'createPendingSubscription',
    })
  }

  pendingSubscriptions.set(token, pending)
  cleanExpiredTokens()
  return token
}

export async function validateToken(token: string): Promise<PendingSubscription | null> {
  const [dbRecord] = await db
    .select()
    .from(newsletterConfirmations)
    .where(
      and(eq(newsletterConfirmations.token, token), isNull(newsletterConfirmations.confirmedAt))
    )
    .limit(1)

  if (dbRecord) {
    const now = new Date()
    const expiresAt = new Date(dbRecord.expiresAt)
    if (now > expiresAt) {
      return null
    }

    return {
      email: dbRecord.email,
      firstName: dbRecord.firstName ?? undefined,
      DataSubjectId: dbRecord.dataSubjectId,
      token: dbRecord.token,
      createdAt: dbRecord.createdAt.toISOString(),
      expiresAt: dbRecord.expiresAt.toISOString(),
      consentTimestamp: dbRecord.consentTimestamp.toISOString(),
      userAgent: dbRecord.userAgent ?? 'unknown',
      ipAddress: dbRecord.ipAddress ?? undefined,
      verified: false,
      source: dbRecord.source as PendingSubscription['source'],
    }
  }

  const pending = pendingSubscriptions.get(token)
  if (!pending) {
    return null
  }

  const now = new Date()
  const expiresAt = new Date(pending.expiresAt)

  if (now > expiresAt) {
    pendingSubscriptions.delete(token)
    return null
  }

  if (pending.verified) {
    return null
  }

  return pending
}

export async function confirmSubscription(token: string): Promise<PendingSubscription | null> {
  const pending = await validateToken(token)
  if (!pending) {
    return null
  }

  await db
    .update(newsletterConfirmations)
    .set({ confirmedAt: new Date() })
    .where(eq(newsletterConfirmations.token, token))

  pending.verified = true
  pendingSubscriptions.delete(token)
  return pending
}

function cleanExpiredTokens(): void {
  const now = new Date()
  for (const [token, pending] of pendingSubscriptions.entries()) {
    const expiresAt = new Date(pending.expiresAt)
    if (now > expiresAt) {
      pendingSubscriptions.delete(token)
    }
  }
}

export function getPendingCount(): number {
  return pendingSubscriptions.size
}

export async function deleteNewsletterConfirmationsByEmail(email: string): Promise<number> {
  const normalizedEmail = email.trim().toLowerCase()
  const deleted = await db
    .delete(newsletterConfirmations)
    .where(eq(newsletterConfirmations.email, normalizedEmail))
    .returning({ id: newsletterConfirmations.id })

  return deleted.length
}
