/**
 * Consent Audit Trail Logging
 * GDPR Article 7(1) requires proof of consent
 * Stores consent records for compliance and data subject access requests
 */

import { validate as isValidUUID } from 'uuid'

/**
 * Consent record stored in audit trail
 */
export interface ConsentRecord {
  id: string // UUID - Unique identifier for this consent instance
  email?: string // Optional - not applicable for client-side consent events
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  timestamp: string // ISO 8601
  source: 'contact_form' | 'newsletter_form' | 'download_form'
  userAgent: string
  ipAddress?: string // Optional, only store if needed for fraud prevention
  privacyPolicyVersion: string // Track which policy version user agreed to
  consentText?: string // Optional: Store exact consent text shown to user
  verified?: boolean // Optional - For double opt-in flows only
}

/**
 * In-memory consent log storage
 * In production, use database (PostgreSQL, MongoDB) or file-based storage
 */
const consentLogs: ConsentRecord[] = []

/**
 * Record consent in audit trail
 * Call this whenever user gives explicit consent
 */
export async function recordConsent(data: {
  id: string // UUID - Must be a valid UUID v4
  email?: string
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  source: 'contact_form' | 'newsletter_form' | 'download_form'
  userAgent: string
  ipAddress?: string
  consentText?: string
  verified?: boolean
}): Promise<ConsentRecord> {
  // Validate UUID
  if (!isValidUUID(data.id)) {
    throw new Error(`Invalid consent ID: must be a valid UUID. Received: ${data.id}`)
  }

  const record: ConsentRecord = {
    id: data.id,
    ...(data.email && { email: data.email.toLowerCase().trim() }),
    purposes: data.purposes,
    timestamp: new Date().toISOString(),
    source: data.source,
    userAgent: data.userAgent,
    ...(data.ipAddress && { ipAddress: data.ipAddress }),
    privacyPolicyVersion: '2025-10-20', // Update when privacy policy changes
    ...(data.consentText && { consentText: data.consentText }),
    ...(data.verified !== undefined && { verified: data.verified }),
  }

  // Store consent record
  consentLogs.push(record)

  // In production: Save to database
  // await db.consentLogs.insert(record)

  console.log(`✅ Consent recorded: ${record.id}`)
  if (record.email) {
    console.log(`   Email: ${record.email}`)
  }
  console.log(`   Purposes: ${record.purposes.join(', ')}`)
  console.log(`   Source: ${record.source}`)
  if (record.verified !== undefined) {
    console.log(`   Verified: ${record.verified}`)
  }

  return record
}

/**
 * Get all consent records for a specific email
 * Used for data subject access requests (GDPR Article 15)
 */
export async function getConsentRecords(email: string): Promise<ConsentRecord[]> {
  const normalizedEmail = email.toLowerCase().trim()
  return consentLogs.filter((log) => log.email === normalizedEmail)
}

/**
 * Get consent records by purpose
 * Useful for checking marketing consent status
 */
export async function getConsentByPurpose(
  email: string,
  purpose: 'contact' | 'marketing' | 'analytics' | 'downloads',
): Promise<ConsentRecord[]> {
  const normalizedEmail = email.toLowerCase().trim()
  return consentLogs.filter(
    (log) => log.email === normalizedEmail && log.purposes.includes(purpose),
  )
}

/**
 * Check if user has active consent for a purpose
 * Returns the most recent verified consent record, or null
 */
export async function hasActiveConsent(
  email: string,
  purpose: 'contact' | 'marketing' | 'analytics' | 'downloads',
): Promise<ConsentRecord | null> {
  const records = await getConsentByPurpose(email, purpose)

  // Filter for verified consents only
  const verifiedRecords = records.filter((r) => r.verified === true)

  if (verifiedRecords.length === 0) {
    return null
  }

  // Return most recent
  const sorted = verifiedRecords.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  return sorted[0] ?? null
}

/**
 * Delete all consent records for an email
 * Used for GDPR right to erasure (Article 17)
 */
export async function deleteConsentRecords(email: string): Promise<number> {
  const normalizedEmail = email.toLowerCase().trim()
  const initialLength = consentLogs.length

  // Filter out records for this email
  const remainingLogs = consentLogs.filter((log) => log.email !== normalizedEmail)
  consentLogs.length = 0
  consentLogs.push(...remainingLogs)

  const deletedCount = initialLength - consentLogs.length

  console.log(`🗑️  Deleted ${deletedCount} consent record(s) for ${email}`)

  return deletedCount
}

/**
 * Export all consent records for a user (GDPR Article 15 - Right of Access)
 * Returns data in portable JSON format
 */
export async function exportUserConsentData(email: string): Promise<string> {
  const records = await getConsentRecords(email)

  const exportData = {
    email,
    exportDate: new Date().toISOString(),
    recordCount: records.length,
    consentRecords: records.map((record) => ({
      id: record.id,
      purposes: record.purposes,
      timestamp: record.timestamp,
      source: record.source,
      privacyPolicyVersion: record.privacyPolicyVersion,
      verified: record.verified,
      // Omit potentially sensitive data like IP address and user agent
    })),
  }

  return JSON.stringify(exportData, null, 2)
}
