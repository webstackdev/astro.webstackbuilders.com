import { getInput, info, setFailed } from '@actions/core'
import { createClient } from '@libsql/client'
import { pathToFileURL } from 'url'

const getOptionalInputOrEnv = (inputName: string, envName: string): string => {
  const input = getInput(inputName).trim()
  if (input) {
    return input
  }
  return (process.env[envName] ?? '').trim()
}

const getRequiredValue = (value: string, label: string): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`Missing ${label}`)
  }
  return trimmed
}

export const run = async (): Promise<void> => {
  try {
    const url = getOptionalInputOrEnv('astro-db-remote-url', 'ASTRO_DB_REMOTE_URL')
    const authToken = getOptionalInputOrEnv('astro-db-app-token', 'ASTRO_DB_APP_TOKEN')

    const requiredUrl = getRequiredValue(url, 'ASTRO_DB_REMOTE_URL')
    const requiredAuthToken = getRequiredValue(authToken, 'ASTRO_DB_APP_TOKEN')

    const client = createClient({ url: requiredUrl, authToken: requiredAuthToken })
    try {
      await client.execute('SELECT 1')
      info('[ping-turso] OK')
    } finally {
      client.close()
    }
  } catch (error: unknown) {
    setFailed(error instanceof Error ? error.message : String(error))
  }
}

const mainModulePath = process.argv[1]
if (mainModulePath && import.meta.url === pathToFileURL(mainModulePath).href) {
  void run()
}
