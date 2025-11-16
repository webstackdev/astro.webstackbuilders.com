/**
 * Client-side method to determine correct URL
 */

import { DEV_SERVER_PORT } from "astro:env/client"
import { isProd, isE2eTest } from '@components/scripts/utils/environmentClient'

export const getSiteUrl = () => {
  if (isProd() && !isE2eTest()) {
    console.log(
      `Using production environment with domain from astro config: ${import.meta.env.SITE}`
    )
    return `https://${import.meta.env.SITE}`
  } else {
    console.log(`Using development environment on port ${DEV_SERVER_PORT}.`)
    return `http://localhost:${DEV_SERVER_PORT}`
  }
}
