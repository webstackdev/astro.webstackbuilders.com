import { createClient } from '@libsql/client'
import path from 'node:path'

const resolveDatabaseUrl = () => {
  const databaseFile = process.env['ASTRO_DATABASE_FILE'] ?? path.join(process.cwd(), '.astro', 'content.db')
  const absolutePath = databaseFile.startsWith('file:') ? databaseFile : `file:${path.resolve(databaseFile)}`
  return absolutePath
}

export const getLibsqlClient = () => {
  const url = resolveDatabaseUrl()
  return createClient({ url })
}
