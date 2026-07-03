import { mkdir } from 'node:fs/promises'
import { createClient } from '@libsql/client'
import { devDatabaseDir, testDatabaseFile } from './paths'

const seededConsentSubjectOne = '00000000-0000-0000-0000-000000000001'
const seededConsentSubjectTwo = '00000000-0000-0000-0000-000000000002'

const seededConsentSubjectIds = [seededConsentSubjectOne, seededConsentSubjectTwo]

type SeededConsentRow = {
  id: string
  dataSubjectId: string
  email: string | null
  purposes: string
  source: string
  userAgent: string
  ipAddress: string | null
  privacyPolicyVersion: string
  consentText: string | null
  verified: number
}

const seededConsentRows: SeededConsentRow[] = [
  {
    id: 'seed-consent-1',
    dataSubjectId: seededConsentSubjectOne,
    email: 'seed@example.com',
    purposes: JSON.stringify(['analytics', 'contact']),
    source: 'seed_script',
    userAgent: 'seed-agent',
    ipAddress: '127.0.0.1',
    privacyPolicyVersion: 'seed',
    consentText: 'Seeded consent record',
    verified: 1,
  },
  {
    id: 'seed-consent-2',
    dataSubjectId: seededConsentSubjectTwo,
    email: null,
    purposes: JSON.stringify(['marketing']),
    source: 'seed_script',
    userAgent: 'seed-agent',
    ipAddress: null,
    privacyPolicyVersion: 'seed',
    consentText: null,
    verified: 0,
  },
]

const ensureRequiredTables = async (databaseUrl: string, authToken?: string) => {
  const client = createClient(
    authToken ? { url: databaseUrl, authToken } : { url: databaseUrl }
  )

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS consentEvents (
        id TEXT PRIMARY KEY,
        dataSubjectId TEXT NOT NULL,
        email TEXT,
        purposes TEXT NOT NULL,
        source TEXT NOT NULL,
        userAgent TEXT NOT NULL,
        ipAddress TEXT,
        privacyPolicyVersion TEXT NOT NULL,
        consentText TEXT,
        verified INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      );
    `)

    await client.execute(`
      CREATE INDEX IF NOT EXISTS consentEvents_subjectCreatedAt
      ON consentEvents (dataSubjectId, createdAt);
    `)

    await client.execute(`
      CREATE INDEX IF NOT EXISTS consentEvents_ipCreatedAt
      ON consentEvents (ipAddress, createdAt);
    `)

    await client.execute(`
      CREATE TABLE IF NOT EXISTS rateLimitWindows (
        id TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        identifier TEXT NOT NULL,
        hits INTEGER NOT NULL,
        "limit" INTEGER NOT NULL,
        windowMs INTEGER NOT NULL,
        windowExpiresAt INTEGER NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `)

    await client.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS rateLimitWindows_scopeIdentifier
      ON rateLimitWindows (scope, identifier);
    `)

    await client.execute(`
      CREATE TABLE IF NOT EXISTS dsarRequests (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        email TEXT NOT NULL,
        requestType TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        fulfilledAt TEXT,
        createdAt TEXT NOT NULL
      );
    `)

    await client.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS dsarRequests_token
      ON dsarRequests (token);
    `)

    await client.execute(`
      CREATE INDEX IF NOT EXISTS dsarRequests_emailRequestType
      ON dsarRequests (email, requestType);
    `)

    await client.execute(`
      CREATE TABLE IF NOT EXISTS newsletterConfirmations (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        email TEXT NOT NULL,
        dataSubjectId TEXT NOT NULL,
        firstName TEXT,
        source TEXT NOT NULL,
        userAgent TEXT,
        ipAddress TEXT,
        consentTimestamp TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        confirmedAt TEXT,
        createdAt TEXT NOT NULL
      );
    `)

    await client.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS newsletterConfirmations_token
      ON newsletterConfirmations (token);
    `)

    await client.execute(`
      CREATE INDEX IF NOT EXISTS newsletterConfirmations_emailSubject
      ON newsletterConfirmations (email, dataSubjectId);
    `)
  } finally {
    client.close()
  }
}

const seedRequiredRows = async (databaseUrl: string, authToken?: string) => {
  const client = createClient(
    authToken ? { url: databaseUrl, authToken } : { url: databaseUrl }
  )

  try {
    const nowIso = new Date().toISOString()
    const windowExpiresAt = Date.now() + 60000

    for (const subjectId of seededConsentSubjectIds) {
      await client.execute({
        sql: 'DELETE FROM consentEvents WHERE dataSubjectId = ?',
        args: [subjectId],
      })
    }

    await client.execute({
      sql: 'DELETE FROM rateLimitWindows WHERE scope = ? AND identifier = ?',
      args: ['seed', 'local'],
    })

    for (const row of seededConsentRows) {
      await client.execute({
        sql: `
          INSERT INTO consentEvents (
            id, dataSubjectId, email, purposes, source, userAgent,
            ipAddress, privacyPolicyVersion, consentText, verified, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          row.id,
          row.dataSubjectId,
          row.email ?? null,
          row.purposes,
          row.source,
          row.userAgent,
          row.ipAddress ?? null,
          row.privacyPolicyVersion,
          row.consentText ?? null,
          row.verified,
          nowIso,
        ],
      })
    }

    await client.execute({
      sql: `
        INSERT INTO rateLimitWindows (
          id, scope, identifier, hits, "limit", windowMs, windowExpiresAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        'seed-rate-limit-1',
        'seed',
        'local',
        0,
        1,
        60000,
        windowExpiresAt,
        nowIso,
      ],
    })
  } finally {
    client.close()
  }
}

export const resolveTestDatabaseFile = () => testDatabaseFile

export const prepareDatabase = async () => {
  await mkdir(devDatabaseDir, { recursive: true })
  const databaseUrl = `file:${testDatabaseFile}`
  const authToken = process.env['ASTRO_DB_APP_TOKEN']

  // Keep E2E bootstrap independent from Astro DB CLI behavior across Astro versions.
  await ensureRequiredTables(databaseUrl, authToken)
  await seedRequiredRows(databaseUrl, authToken)
}
