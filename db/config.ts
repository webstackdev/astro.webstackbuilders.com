import { column, defineDb, defineTable } from 'astro:db'

const consentEvents = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    dataSubjectId: column.text({ notNull: true }),
    email: column.text(),
    purposes: column.json<string[]>({ notNull: true }),
    source: column.text({ notNull: true }),
    userAgent: column.text({ notNull: true }),
    ipAddress: column.text(),
    privacyPolicyVersion: column.text({ notNull: true }),
    consentText: column.text(),
    verified: column.boolean({ notNull: true, default: false }),
    createdAt: column.date({ notNull: true }),
  },
  indexes: {
    subjectCreatedAt: {
      on: ['dataSubjectId', 'createdAt'],
    },
    ipCreatedAt: {
      on: ['ipAddress', 'createdAt'],
    },
  },
})

const rateLimitWindows = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    scope: column.text({ notNull: true }),
    identifier: column.text({ notNull: true }),
    hits: column.number({ notNull: true }),
    limit: column.number({ notNull: true }),
    windowMs: column.number({ notNull: true }),
    windowExpiresAt: column.number({ notNull: true }),
    updatedAt: column.date({ notNull: true }),
  },
  indexes: {
    scopeIdentifier: {
      on: ['scope', 'identifier'],
      unique: true,
    },
  },
})

const dsarRequests = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    token: column.text({ notNull: true }),
    email: column.text({ notNull: true }),
    requestType: column.text({ notNull: true }),
    expiresAt: column.date({ notNull: true }),
    fulfilledAt: column.date(),
    createdAt: column.date({ notNull: true }),
  },
  indexes: {
    tokenUnique: {
      on: ['token'],
      unique: true,
    },
    emailRequestType: {
      on: ['email', 'requestType'],
    },
  },
})

const newsletterConfirmations = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    token: column.text({ notNull: true }),
    email: column.text({ notNull: true }),
    dataSubjectId: column.text({ notNull: true }),
    firstName: column.text(),
    source: column.text({ notNull: true }),
    userAgent: column.text(),
    ipAddress: column.text(),
    consentTimestamp: column.date({ notNull: true }),
    expiresAt: column.date({ notNull: true }),
    confirmedAt: column.date(),
    createdAt: column.date({ notNull: true }),
  },
  indexes: {
    tokenUnique: {
      on: ['token'],
      unique: true,
    },
    emailSubject: {
      on: ['email', 'dataSubjectId'],
    },
  },
})

// https://astro.build/db/config
export default defineDb({
  tables: {
    consentEvents,
    rateLimitWindows,
    dsarRequests,
    newsletterConfirmations,
  },
})

export { consentEvents, rateLimitWindows, dsarRequests, newsletterConfirmations }
