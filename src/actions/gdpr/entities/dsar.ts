import { randomUUID } from 'node:crypto'
import { and, db, dsarRequests, eq, gt, isNull } from 'astro:db'
import type {
  CreateDsarRequestInput,
  DsarRequestRecord,
  DSARRequest,
  DsarVerifyResult,
  RequestType
} from '@actions/gdpr/@types'
import { deleteNewsletterConfirmationsByEmail } from '@actions/newsletter/domain'
import { deleteConsentRecordsByEmail, findConsentRecordsByEmail } from '@actions/gdpr/entities/consent'

export async function findActiveRequestByEmail(
  email: string,
  requestType: RequestType
): Promise<DsarRequestRecord | undefined> {
  const [record] = await db
    .select()
    .from(dsarRequests)
    .where(
      and(
        eq(dsarRequests.email, email),
        eq(dsarRequests.requestType, requestType),
        isNull(dsarRequests.fulfilledAt),
        gt(dsarRequests.expiresAt, new Date())
      )
    )
    .limit(1)

  return record
}

export async function createDsarRequest(input: CreateDsarRequestInput): Promise<DsarRequestRecord> {
  const [record] = await db
    .insert(dsarRequests)
    .values({
      id: randomUUID(),
      token: input.token,
      email: input.email,
      requestType: input.requestType,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    })
    .returning()

  if (!record) {
    throw new Error('Failed to create DSAR request')
  }

  return record
}

export async function findDsarRequestByToken(
  token: string
): Promise<DsarRequestRecord | undefined> {
  const [record] = await db
    .select()
    .from(dsarRequests)
    .where(eq(dsarRequests.token, token))
    .limit(1)
  return record
}

export async function markDsarRequestFulfilled(token: string): Promise<void> {
  await db
    .update(dsarRequests)
    .set({ fulfilledAt: new Date() })
    .where(eq(dsarRequests.token, token))
}

export async function verifyDsarToken(token: string): Promise<DsarVerifyResult> {
  const dbRequest = await findDsarRequestByToken(token)

  if (!dbRequest) {
    return { status: 'invalid' }
  }

  const dsarRequest: DSARRequest = {
    id: dbRequest.id,
    token: dbRequest.token,
    email: dbRequest.email,
    requestType: dbRequest.requestType as DSARRequest['requestType'],
    expiresAt: dbRequest.expiresAt.toISOString(),
    createdAt: dbRequest.createdAt.toISOString(),
    ...(dbRequest.fulfilledAt && { fulfilledAt: dbRequest.fulfilledAt.toISOString() }),
  }

  if (dsarRequest.fulfilledAt) {
    return { status: 'already-completed' }
  }

  if (new Date(dsarRequest.expiresAt) < new Date()) {
    return { status: 'expired' }
  }

  const email = dsarRequest.email
  const requestType = dsarRequest.requestType

  if (requestType === 'ACCESS') {
    const consentRecords = await findConsentRecordsByEmail(email)
    await markDsarRequestFulfilled(token)

    const exportData = {
      email,
      requestDate: dsarRequest.createdAt,
      consentRecords: consentRecords.map(({ ipAddress: _ip, ...record }) => ({
        ...record,
        createdAt:
          record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      })),
    }

    return {
      status: 'download',
      filename: `my-data-${Date.now()}.json`,
      json: JSON.stringify(exportData, null, 2),
    }
  }

  if (requestType === 'DELETE') {
    await deleteConsentRecordsByEmail(email)
    await deleteNewsletterConfirmationsByEmail(email)
    await markDsarRequestFulfilled(token)
    return { status: 'deleted' }
  }

  return { status: 'error' }
}
