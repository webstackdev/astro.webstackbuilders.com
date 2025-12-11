import type { FullConfig } from '@playwright/test'
import { prepareDatabase, resolveTestDatabaseFile } from './runtime/database'
import { startWiremock } from './runtime/wiremock'

async function globalSetup(_config: FullConfig) {
  const testDatabaseFile = resolveTestDatabaseFile()

  process.env['PLAYWRIGHT'] = 'true'
  process.env['DEV'] = 'true'
  process.env['MODE'] = 'test'
  process.env['NODE_ENV'] = 'development'
  process.env['PROD'] = 'false'
  process.env['ASTRO_DATABASE_FILE'] = testDatabaseFile

  await prepareDatabase()
  await startWiremock()
}

export default globalSetup
