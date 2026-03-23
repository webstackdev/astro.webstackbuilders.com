/**
 * Browser-only site URL helper.
 *
 * Safe to use:
 * - in client bundle code under src/components/scripts or component/page client directories
 * - in browser-executed test fixtures that intentionally verify client behavior
 *
 * Not safe to use:
 * - in Astro frontmatter
 * - in server-rendered .astro components
 * - in actions, API routes, email generation, or any other SSR/server code
 *
 * Why:
 * - this module imports astro:env/client, which is meant for browser/client code
 * - it returns a browser-oriented static site URL, not a request-aware runtime URL
 * - server-side code must instead use Astro context, request origin, or server-safe URL helpers
 */

import { DEV_SERVER_PORT } from 'astro:env/client'
import { isProd, isE2eTest } from '@components/scripts/utils/environmentClient'

/**
 * Returns the browser-facing site origin for client-side code.
 */
export const getSiteUrl = () => {
  if (isProd() && !isE2eTest()) {
    return `https://www.webstackbuilders.com`
  } else {
    console.log(`Using development environment on port ${DEV_SERVER_PORT}.`)
    return `http://localhost:${DEV_SERVER_PORT}`
  }
}
