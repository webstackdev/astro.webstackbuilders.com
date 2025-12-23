/**
 * Method to determine correct site URL in serverless functions (API routes)
 */

import { isVercel } from './environmentApi'

const devServerPort = process.env['DEV_SERVER_PORT']?.trim()
const resolvedDevServerPort = devServerPort && devServerPort.length > 0 ? devServerPort : '4321'

export const getSiteUrl = (): string => {
  if (isVercel()) {
    return `https://www.webstackbuilders.com`
  }

  return `http://localhost:${resolvedDevServerPort}`
}
