/**
 * Server-side method to determine correct URL
 */
import packageJson from '../../../package.json' with { type: 'json' }
import { BuildError } from '../errors/BuildError'
import { isVercel } from './environmentServer'

const { domain } = packageJson
const devServerPort = process.env['DEV_SERVER_PORT']?.trim()
const resolvedDevServerPort = devServerPort && devServerPort.length > 0 ? devServerPort : '4321'

/** Called from astro.config.ts to determine "site" config key */
export const getSiteUrl = (): string => {
  if (isVercel() && domain) {
    return `https://${domain}`
  }

  if (isVercel() && !domain) {
    throw new BuildError('❌ Domain is required in package.json for Vercel production environment.')
  }

  return `http://localhost:${resolvedDevServerPort}`
}
