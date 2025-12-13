/**
 * Newsletter subscription token management for double opt-in
 * Generates and validates confirmation tokens for GDPR-compliant newsletter signups
 */

import { randomUUID } from 'node:crypto'
import { and, db, eq, isNull, newsletterConfirmations } from 'astro:db'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'

/**
 * Pending subscription data stored temporarily until confirmed
 */
export interface PendingSubscription {
  email: string
  firstName?: string | undefined
  DataSubjectId: string
  token: string
  createdAt: string // ISO 8601
  expiresAt: string // ISO 8601 - 24 hours from creation
  consentTimestamp: string // ISO 8601
  userAgent: string
  ipAddress?: string | undefined // Optional, for fraud prevention only
  verified: boolean
  source: 'newsletter_form' | 'contact_form'
}

/**
 * In-memory storage for pending subscriptions
 * In production, use Redis, database, or Vercel KV
 */
const pendingSubscriptions = new Map<string, PendingSubscription>()

/**
 * Generate cryptographically secure token
 * Uses Web Crypto API for secure random generation
 */
export function generateConfirmationToken(): string {
  // Generate 32 random bytes and encode as base64url (URL-safe)
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Create and store a pending subscription
 * Returns the confirmation token to be sent via email
 */
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
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

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
    throw new ApiFunctionError({
      message: 'Failed to create subscription confirmation',
      cause: error,
      code: 'NEWSLETTER_TOKEN_CREATE_FAILED',
      status: 500,
      route: '/api/newsletter',
      operation: 'createPendingSubscription',
    })
  }

  // Also keep in memory for backward compatibility (for now)
  pendingSubscriptions.set(token, pending)

  // Clean up expired tokens (simple garbage collection)
  cleanExpiredTokens()

  return token
}

/**
 * Validate and retrieve pending subscription by token
 * Returns null if token is invalid or expired
 */
export async function validateToken(
  token: string,
): Promise<PendingSubscription | null> {
  const [dbRecord] = await db
    .select()
    .from(newsletterConfirmations)
    .where(
      and(
        eq(newsletterConfirmations.token, token),
        isNull(newsletterConfirmations.confirmedAt),
      ),
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

  // Fallback to in-memory (for backward compatibility)
  const pending = pendingSubscriptions.get(token)

  if (!pending) {
    return null
  }

  // Check if expired
  const now = new Date()
  const expiresAt = new Date(pending.expiresAt)

  if (now > expiresAt) {
    // Token expired, remove it
    pendingSubscriptions.delete(token)
    return null
  }

  // Check if already verified
  if (pending.verified) {
    return null
  }

  return pending
}

/**
 * Mark subscription as verified and remove from pending
 * Returns the subscription data for processing
 */
export async function confirmSubscription(
  token: string,
): Promise<PendingSubscription | null> {
  const pending = await validateToken(token)

  if (!pending) {
    return null
  }

  await db
    .update(newsletterConfirmations)
    .set({ confirmedAt: new Date() })
    .where(eq(newsletterConfirmations.token, token))

  // Mark as verified
  pending.verified = true

  // Remove from in-memory pending (one-time use token)
  pendingSubscriptions.delete(token)

  return pending
}

/**
 * Clean up expired tokens from storage
 * Should be called periodically or on each new subscription
 */
function cleanExpiredTokens(): void {
  const now = new Date()

  for (const [token, pending] of pendingSubscriptions.entries()) {
    const expiresAt = new Date(pending.expiresAt)
    if (now > expiresAt) {
      pendingSubscriptions.delete(token)
    }
  }
}

/**
 * Get all pending subscriptions (for testing/debugging)
 * Should be removed or protected in production
 */
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
