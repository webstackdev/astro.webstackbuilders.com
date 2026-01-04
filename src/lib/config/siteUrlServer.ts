/**
 * Server-side method to determine correct URL
 */
import { BuildError } from '../errors/BuildError'
import {
  isProd,
  isVercel
} from './environmentServer'

const devServerPort = process.env['DEV_SERVER_PORT']?.trim()
const resolvedDevServerPort = devServerPort && devServerPort.length > 0 ? devServerPort : '4321'

/** Called from astro.config.ts to determine "site" config key */
export const getSiteUrl = (): string => {
  // Vercel tooling can set VERCEL env vars during CI builds; only treat this as an error
  // when the config is evaluated on Vercel infrastructure (not GitHub Actions).
  if (isVercel()) {
    throw new BuildError(
      '❌ Build runs on GitHub, so this build-time getSiteUrl() function should never be called on Vercel.'
    )
  }

  if (isProd()) {
    return 'https://www.webstackbuilders.com'
  }

  return `http://localhost:${resolvedDevServerPort}`
}
