/**
 * Server-side method to determine correct URL
 */

import packageJson from '../../../../../package.json' with { type: 'json' }
import { isVercel } from './environmentApi'

const devServerPort = process.env['DEV_SERVER_PORT']?.trim()
const resolvedDevServerPort = devServerPort && devServerPort.length > 0 ? devServerPort : '4321'
const { domain } = packageJson

/** Called from astro.config.ts to determine "site" config key */
export const getSiteUrl = (): string => {
  if (isVercel() && domain) {
    return `https://${domain}`
  }

  return `http://localhost:${resolvedDevServerPort}`
}
