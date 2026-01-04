import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@actions/newsletter/utils', () => {
  return {
    generateConfirmationToken: () => 'token-fixed',
  }
})

vi.mock('node:crypto', () => {
  return {
    randomUUID: () => 'uuid-fixed',
  }
})

vi.mock('astro:db', () => {
  const newsletterConfirmations = {
    id: 'id',
    token: 'token',
    email: 'email',
    dataSubjectId: 'dataSubjectId',
    firstName: 'firstName',
    source: 'source',
    userAgent: 'userAgent',
    ipAddress: 'ipAddress',
    consentTimestamp: 'consentTimestamp',
    expiresAt: 'expiresAt',
    confirmedAt: 'confirmedAt',
    createdAt: 'createdAt',
  }

  const state = {
    selectResult: [] as any[],
    inserted: [] as any[],
    updated: [] as any[],
    deleted: [] as any[],
    lastEqArgs: [] as any[],
  }

  const db = {
    insert: vi.fn(() => ({
      values: vi.fn(async (value: any) => {
        state.inserted.push(value)
        return value
      }),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => state.selectResult),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((value: any) => {
        state.updated.push(value)
        return {
          where: vi.fn(async (_where: any) => undefined),
        }
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn((_where: any) => ({
        returning: vi.fn(async (_shape: any) => {
          state.deleted.push(_where)
          return [{ id: 'deleted-1' }]
        }),
      })),
    })),
  }

  const eq = vi.fn((left: any, right: any) => {
    state.lastEqArgs.push([left, right])
    return { left, right }
  })

  const and = vi.fn((...clauses: any[]) => ({ clauses }))
  const isNull = vi.fn((value: any) => ({ isNull: value }))

  return {
    db,
    eq,
    and,
    isNull,
    newsletterConfirmations,
    __state: state,
  }
})

import {
  confirmSubscription,
  createPendingSubscription,
  deleteNewsletterConfirmationsByEmail,
  getPendingCount,
  validateToken,
} from '../domain'

beforeEach(async () => {
  vi.clearAllMocks()
  const astroDb = await import('astro:db')
  ;(astroDb as any).__state.selectResult = []
  ;(astroDb as any).__state.inserted = []
  ;(astroDb as any).__state.updated = []
  ;(astroDb as any).__state.deleted = []
  ;(astroDb as any).__state.lastEqArgs = []
})

describe('newsletter domain', () => {
  it('createPendingSubscription normalizes email/firstName and persists confirmation', async () => {
    const token = await createPendingSubscription({
      email: ' TEST@Example.com ',
      firstName: '  Jane  ',
      DataSubjectId: 'sub_1',
      userAgent: 'ua',
      ipAddress: '127.0.0.1',
      source: 'newsletter_form',
    })

    expect(token).toBe('token-fixed')
    expect(getPendingCount()).toBeGreaterThan(0)

    const astroDb = await import('astro:db')
    const inserted = (astroDb as any).__state.inserted
    expect(inserted).toHaveLength(1)

    expect(inserted[0]).toMatchObject({
      id: 'uuid-fixed',
      token: 'token-fixed',
      email: 'test@example.com',
      dataSubjectId: 'sub_1',
      firstName: 'Jane',
      source: 'newsletter_form',
      userAgent: 'ua',
      ipAddress: '127.0.0.1',
      confirmedAt: null,
    })
  })

  it('validateToken returns null when DB record is expired', async () => {
    const astroDb = await import('astro:db')
    ;(astroDb as any).__state.selectResult = [
      {
        token: 'token-fixed',
        email: 'test@example.com',
        dataSubjectId: 'sub_1',
        firstName: null,
        source: 'newsletter_form',
        userAgent: 'ua',
        ipAddress: null,
        consentTimestamp: new Date('2025-01-01T00:00:00.000Z'),
        expiresAt: new Date('2000-01-01T00:00:00.000Z'),
        confirmedAt: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ]

    const result = await validateToken('token-fixed')
    expect(result).toBeNull()
  })

  it('confirmSubscription confirms and returns subscription when valid in DB', async () => {
    const astroDb = await import('astro:db')
    ;(astroDb as any).__state.selectResult = [
      {
        token: 'token-fixed',
        email: 'test@example.com',
        dataSubjectId: 'sub_1',
        firstName: 'Jane',
        source: 'newsletter_form',
        userAgent: 'ua',
        ipAddress: '127.0.0.1',
        consentTimestamp: new Date('2025-01-01T00:00:00.000Z'),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        confirmedAt: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ]

    const result = await confirmSubscription('token-fixed')

    expect(result).not.toBeNull()
    expect(result?.email).toBe('test@example.com')
    expect(result?.DataSubjectId).toBe('sub_1')
    expect(result?.verified).toBe(true)

    // ensure update was attempted
    expect((astroDb as any).db.update).toHaveBeenCalledTimes(1)
  })

  it('deleteNewsletterConfirmationsByEmail normalizes email', async () => {
    const astroDb = await import('astro:db')

    const deleted = await deleteNewsletterConfirmationsByEmail(' TEST@Example.com ')

    expect(deleted).toBe(1)

    const lastEqArgs = (astroDb as any).__state.lastEqArgs
    expect(lastEqArgs.length).toBeGreaterThan(0)

    const normalizedEmail = 'test@example.com'
    expect(lastEqArgs.some(([, right]: any[]) => right === normalizedEmail)).toBe(true)
  })
})
