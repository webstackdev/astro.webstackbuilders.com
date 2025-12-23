/**
 * Server-side method to determine correct URL
 */
import { BuildError } from '../errors/BuildError'
import { isVercel } from './environmentServer'

const devServerPort = process.env['DEV_SERVER_PORT']?.trim()
const resolvedDevServerPort = devServerPort && devServerPort.length > 0 ? devServerPort : '4321'

/** Called from astro.config.ts to determine "site" config key */
export const getSiteUrl = (): string => {
  if (isVercel()) {
    throw new BuildError('❌ Build runs on GitHub, so this build-time getSiteUrl() function should never be called on Vercel.')
  }

  return `http://localhost:${resolvedDevServerPort}`
}
