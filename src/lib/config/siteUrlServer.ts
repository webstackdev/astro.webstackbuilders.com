/**
 * Server-side method to determine correct URL
 */
import { loadEnv } from 'vite'
import { domain } from '../../../package.json' with { type: 'json' }
import { isVercel } from './environmentServer'

const { DEV_SERVER_PORT } = loadEnv(process.env['NODE_ENV'] ?? 'development', process.cwd(), '')

/** Called from astro.config.ts to determine "site" config key */
export const getSiteUrl = (): string => {
  if (isVercel() && domain) {
    console.log(`Using production environment with domain from package.json: ${domain}`)
    return `https://${domain}`
  } else if (!!DEV_SERVER_PORT) {
    console.log(`Using development environment on port ${DEV_SERVER_PORT}.`)
    return `http://localhost:${DEV_SERVER_PORT}`
  } else {
    console.log(
      `Using default value of "http://localhost:4321" for the site URL. DEV_SERVER_PORT is not set in the environment.`
    )
    return `http://localhost:${DEV_SERVER_PORT}`
  }
}
