import { isVercel } from './environmentActions'
import { getOptionalEnv } from '@lib/config/environmentServer'

const devServerPort = getOptionalEnv('DEV_SERVER_PORT')?.trim()
const resolvedDevServerPort = devServerPort && devServerPort.length > 0 ? devServerPort : '4321'

export const getSiteUrl = (): string => {
  if (isVercel()) {
    return `https://www.webstackbuilders.com`
  }

  return `http://localhost:${resolvedDevServerPort}`
}
