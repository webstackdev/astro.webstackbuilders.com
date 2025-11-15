/**
 * Server-side method to determine correct URL
 */
import { DEV_SERVER_PORT } from "astro:env/client"
import { domain } from '../../../package.json' with { type: 'json' }
import { isVercel } from '@lib/config/environmentServer'

/** Called from astro.config.ts to determine "site" config key */
export const getSiteUrl = (): string => {
  if (isVercel() && domain) {
    console.log(`Using production environment with domain from package.json: ${domain}`)
    return `https://${domain}`
  } else {
    console.log(`Using development environment on port ${DEV_SERVER_PORT}.`)
    return `http://localhost:${DEV_SERVER_PORT}`
  }
}
