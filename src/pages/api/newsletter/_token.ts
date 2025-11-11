/**
 * Newsletter subscription token management for double opt-in
 * Generates and validates confirmation tokens for GDPR-compliant newsletter signups
 */

import { supabaseAdmin } from '@components/scripts/consent/db/supabase'

/**
 * Pending subscription data stored temporarily until confirmed
 */
export interface PendingSubscription {
  email: string
  firstName?: string
  DataSubjectId: string
  token: string
  createdAt: string // ISO 8601
  expiresAt: string // ISO 8601 - 24 hours from creation
  consentTimestamp: string // ISO 8601
  userAgent: string
  ipAddress?: string // Optional, for fraud prevention only
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

  // Store in Supabase newsletter_confirmations table
  const { error } = await supabaseAdmin
    .from('newsletter_confirmations')
    .insert({
      token,
      email: pending.email,
      data_subject_id: pending.DataSubjectId,
      expires_at: expiresAt.toISOString()
    })

  if (error) {
    console.error('Failed to create pending subscription:', error)
    throw new Error('Failed to create subscription confirmation')
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
  // Try Supabase first
  const { data: dbRecord } = await supabaseAdmin
    .from('newsletter_confirmations')
    .select('*')
    .eq('token', token)
    .is('confirmed_at', null) // Not yet confirmed
    .single()

  if (dbRecord) {
    const now = new Date()
    const expiresAt = new Date(dbRecord.expires_at)

    if (now > expiresAt) {
      // Token expired
      return null
    }

    // Convert to PendingSubscription format
    return {
      email: dbRecord.email,
      DataSubjectId: dbRecord.data_subject_id,
      token: dbRecord.token,
      createdAt: dbRecord.created_at,
      expiresAt: dbRecord.expires_at,
      consentTimestamp: dbRecord.created_at,
      userAgent: 'unknown', // Not stored in DB
      verified: false,
      source: 'newsletter_form',
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

  // Mark as confirmed in Supabase
  await supabaseAdmin
    .from('newsletter_confirmations')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('token', token)

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
