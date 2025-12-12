import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { getLibsqlClient } from '../../db/libsqlClient'
import { testDatabaseFile } from './paths'

const seededConsentSubjectIds = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
]

const ensureDatabaseFileExists = async () => {
  try {
    await access(testDatabaseFile, constants.F_OK)
  } catch (error) {
    throw new Error(
      `Astro DB seed verification failed: expected database file at ${testDatabaseFile} is missing.`,
      { cause: error instanceof Error ? error : undefined },
    )
  }
}

const ensureSeededTablesExist = async () => {
  const libsql = getLibsqlClient()
  const { rows } = await libsql.execute({
    sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('consentEvents', 'rateLimitWindows', 'newsletterConfirmations')`,
  })

  const tables = new Set(rows.map((row) => String(row['name'])))
  const missing = ['consentEvents', 'rateLimitWindows', 'newsletterConfirmations'].filter((table) => !tables.has(table))

  if (missing.length) {
    throw new Error(
      `Astro DB seed verification failed: missing tables ${missing.join(', ')}. Did migrations run?`,
    )
  }
}

const ensureSeededConsentRecordsExist = async () => {
  const libsql = getLibsqlClient()
  const missingSubjectIds: string[] = []

  for (const subjectId of seededConsentSubjectIds) {
    const { rows } = await libsql.execute({
      sql: `SELECT dataSubjectId FROM consentEvents WHERE dataSubjectId = ? LIMIT 1`,
      args: [subjectId],
    })

    if (!rows.length) {
      missingSubjectIds.push(subjectId)
    }
  }

  if (missingSubjectIds.length) {
    throw new Error(
        `Astro DB seed verification failed: missing consent records for subjects ${missingSubjectIds.join(', ')}. Rebuild the local snapshot with \`ASTRO_DB_REMOTE_URL="file:./.astro/content.db" npx astro db push\` followed by \`npx astro db execute db/seed.ts\`.`,
    )
  }
}

export const verifyDatabaseSeed = async () => {
  await ensureDatabaseFileExists()
  await ensureSeededTablesExist()
  await ensureSeededConsentRecordsExist()
}
