/**
 * Client-side method to determine correct URL
 */

import { DEV_SERVER_PORT } from 'astro:env/client'
import { isProd, isE2eTest } from '@components/scripts/utils/environmentClient'

export const getSiteUrl = () => {
  if (isProd() && !isE2eTest()) {
    return `https://www.webstackbuilders.com`
  } else {
    console.log(`Using development environment on port ${DEV_SERVER_PORT}.`)
    return `http://localhost:${DEV_SERVER_PORT}`
  }
}
