/**
 * Server-side method to determine correct URL
 */
import packageJson from '../../../package.json' with { type: 'json' }
import { isVercel } from './environmentServer'

const { domain } = packageJson
const devServerPort = process.env['DEV_SERVER_PORT']?.trim()
const resolvedDevServerPort = devServerPort && devServerPort.length > 0 ? devServerPort : '4321'

/** Called from astro.config.ts to determine "site" config key */
export const getSiteUrl = (): string => {
  if (isVercel() && domain) {
    console.log(`Using production environment with domain from package.json: ${domain}`)
    return `https://${domain}`
  }

  if (devServerPort && devServerPort.length > 0) {
    console.log(`Using development environment on port ${resolvedDevServerPort}.`)
  } else {
    console.log(
      'Using default value of "http://localhost:4321" for the site URL. DEV_SERVER_PORT is not set in the environment.'
    )
  }

  return `http://localhost:${resolvedDevServerPort}`
}
