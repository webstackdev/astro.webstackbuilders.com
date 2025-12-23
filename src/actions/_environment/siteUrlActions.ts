import packageJson from '../../../package.json' with { type: 'json' }
import { isVercel } from './environmentActions'
import { getOptionalEnv } from '@lib/config/environmentServer'

const devServerPort = getOptionalEnv('DEV_SERVER_PORT')?.trim()
const resolvedDevServerPort = devServerPort && devServerPort.length > 0 ? devServerPort : '4321'
const { domain } = packageJson

export const getSiteUrl = (): string => {
  if (isVercel() && domain) {
    return `https://${domain}`
  }

  return `http://localhost:${resolvedDevServerPort}`
}
