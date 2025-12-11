import { createClient } from '@libsql/client'
import path from 'node:path'
import { env } from 'node:process'

const resolveDatabaseUrl = () => {
  const file = env['ASTRO_DATABASE_FILE'] ?? path.join(process.cwd(), 'db', 'dev.db')
  if (file.startsWith('file:')) {
    return file
  }
  return `file:${path.resolve(file)}`
}

export const libsql = createClient({
  url: resolveDatabaseUrl(),
})
