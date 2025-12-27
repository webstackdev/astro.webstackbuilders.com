import { randomUUID } from 'node:crypto'
import { and, db, dsarRequests, eq, gt, isNull } from 'astro:db'
import type { DSARRequestInput } from '@actions/gdpr/@types'

export type DsarRequestRecord = typeof dsarRequests.$inferSelect

type RequestType = DSARRequestInput['requestType']

export type CreateDsarRequestInput = {
  token: string
  email: string
  requestType: RequestType
  expiresAt: Date
}

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
