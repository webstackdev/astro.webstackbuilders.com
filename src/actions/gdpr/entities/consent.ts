import { randomUUID } from 'node:crypto'
import { and, consentEvents, db, desc, eq } from 'astro:db'
import { getPrivacyPolicyVersion } from '@actions/utils/environment/environmentActions'
import type {
  ConsentEventRecord,
  ConsentRequest,
  CreateConsentRecordInput,
  DbConsentRecord
} from '@actions/gdpr/@types'
import {
  normalizeNullableString,
  normalizeUserAgent,
  sanitizePurposes,
  sanitizeSource,
} from '@actions/gdpr/utils'

export const toConsentRecord = (record: DbConsentRecord): ConsentEventRecord => ({
  ...record,
  purposes: record.purposes as string[],
})

export function createConsentRecordInput(body: ConsentRequest): CreateConsentRecordInput {
  return {
    dataSubjectId: body.DataSubjectId,
    email: normalizeNullableString(body.email ?? null),
    purposes: sanitizePurposes(body.purposes),
    source: sanitizeSource(body.source),
    userAgent: normalizeUserAgent(body.userAgent),
    ipAddress: normalizeNullableString(body.ipAddress ?? null),
    privacyPolicyVersion: getPrivacyPolicyVersion(),
    consentText: normalizeNullableString(body.consentText ?? null),
    verified: body.verified ?? false,
  }
}

export async function createConsentRecord(
  input: CreateConsentRecordInput
): Promise<ConsentEventRecord> {
  const [record] = await db
    .insert(consentEvents)
    .values({
      id: randomUUID(),
      ...input,
      createdAt: new Date(),
    })
    .returning()

  if (!record) {
    throw new Error('Failed to create consent record')
  }

  return toConsentRecord(record)
}

export async function findConsentRecords(dataSubjectId: string): Promise<ConsentEventRecord[]> {
  const records = await db
    .select()
    .from(consentEvents)
    .where(eq(consentEvents.dataSubjectId, dataSubjectId))
    .orderBy(desc(consentEvents.createdAt))

  return records.map(toConsentRecord)
}

export async function deleteConsentRecords(dataSubjectId: string): Promise<number> {
  const deleted = await db
    .delete(consentEvents)
    .where(eq(consentEvents.dataSubjectId, dataSubjectId))
    .returning({ id: consentEvents.id })

  return deleted.length
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

export async function findConsentRecordsByEmail(email: string): Promise<ConsentEventRecord[]> {
  const normalizedEmail = normalizeEmail(email)
  const records = await db
    .select()
    .from(consentEvents)
    .where(eq(consentEvents.email, normalizedEmail))
    .orderBy(desc(consentEvents.createdAt))

  return records.map(toConsentRecord)
}

export async function deleteConsentRecordsByEmail(email: string): Promise<number> {
  const normalizedEmail = normalizeEmail(email)
  const deleted = await db
    .delete(consentEvents)
    .where(eq(consentEvents.email, normalizedEmail))
    .returning({ id: consentEvents.id })

  return deleted.length
}

export async function markConsentRecordsVerified(
  email: string,
  dataSubjectId: string
): Promise<number> {
  const normalizedEmail = normalizeEmail(email)
  const updated = await db
    .update(consentEvents)
    .set({ verified: true })
    .where(
      and(
        eq(consentEvents.email, normalizedEmail),
        eq(consentEvents.dataSubjectId, dataSubjectId),
        eq(consentEvents.verified, false)
      )
    )
    .returning({ id: consentEvents.id })

  return updated.length
}
