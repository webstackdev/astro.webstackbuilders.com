import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { createClient } from '@libsql/client'
import { devDatabaseDir, testDatabaseFile } from './paths'

const MIGRATION_VERSION = '2024-03-12'

const runCommand = (command: string, args: string[], env?: NodeJS.ProcessEnv) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: env ?? process.env,
      shell: process.platform === 'win32',
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
      }
    })
  })
}

export const resolveTestDatabaseFile = () => testDatabaseFile

const ensureSnapshotTableHasRow = async (databaseUrl: string, authToken?: string) => {
  const client = createClient(
    authToken ? { url: databaseUrl, authToken } : { url: databaseUrl }
  )

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS _astro_db_snapshot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT,
        snapshot BLOB
      );
    `)

    const result = await client.execute(
      'SELECT snapshot FROM _astro_db_snapshot ORDER BY id DESC LIMIT 1'
    )

    if (result.rows.length === 0) {
      const tablesToReset = [
        'consentEvents',
        'rateLimitWindows',
        'dsarRequests',
        'newsletterConfirmations',
      ]

      for (const table of tablesToReset) {
        await client.execute(`DROP TABLE IF EXISTS "${table}"`)
      }

      const snapshot = JSON.stringify({ version: MIGRATION_VERSION, schema: {} })

      await client.execute({
        sql: 'INSERT INTO _astro_db_snapshot (version, snapshot) VALUES (?, ?)',
        args: [MIGRATION_VERSION, snapshot],
      })
    }
  } finally {
    await client.close()
  }
}

const runAstroDb = async (args: string[], env: NodeJS.ProcessEnv) => {
  await runCommand('npx', ['astro', 'db', ...args], env)
}

export const prepareDatabase = async () => {
  await mkdir(devDatabaseDir, { recursive: true })
  // The dev server and Playwright share the same DB file; do not delete it here.
  const databaseUrl = `file:${testDatabaseFile}`
  const env = {
    ...process.env,
    ASTRO_DATABASE_FILE: testDatabaseFile,
    ASTRO_DB_REMOTE_URL: databaseUrl,
  }
  await ensureSnapshotTableHasRow(databaseUrl, process.env['ASTRO_DB_APP_TOKEN'])
  await runAstroDb(['push'], env)
  await runAstroDb(['execute', 'db/seed.ts'], env)
}
