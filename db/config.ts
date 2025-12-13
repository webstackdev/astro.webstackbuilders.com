import { column, defineDb, defineTable } from 'astro:db'

const consentEvents = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    dataSubjectId: column.text({ notNull: true }),
    email: column.text({ optional: true }),
    purposes: column.json<string[]>({ notNull: true }),
    source: column.text({ notNull: true }),
    userAgent: column.text({ notNull: true }),
    ipAddress: column.text({ optional: true }),
    privacyPolicyVersion: column.text({ notNull: true }),
    consentText: column.text({ optional: true }),
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
    fulfilledAt: column.date({ optional: true }),
    createdAt: column.date({ notNull: true }),
  },
  indexes: {
    dsarTokenUnique: {
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
    firstName: column.text({ optional: true }),
    source: column.text({ notNull: true }),
    userAgent: column.text({ optional: true }),
    ipAddress: column.text({ optional: true }),
    consentTimestamp: column.date({ notNull: true }),
    expiresAt: column.date({ notNull: true }),
    confirmedAt: column.date({ optional: true }),
    createdAt: column.date({ notNull: true }),
  },
  indexes: {
    newsletterTokenUnique: {
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
