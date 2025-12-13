import { env } from 'node:process'

type WiremockService = 'convertkit' | 'resend'

const getHost = () => env['WIREMOCK_HOST'] ?? '127.0.0.1'

const getPort = (service: WiremockService) => {
  const defaults: Record<WiremockService, number> = {
    convertkit: 9010,
    resend: 9011,
  }

  const envKey = service === 'convertkit' ? 'CONVERTKIT_HTTP_PORT' : 'RESEND_HTTP_PORT'
  return Number(env[envKey] ?? defaults[service])
}

export const buildWiremockBaseUrl = (service: WiremockService) => {
  return `http://${getHost()}:${getPort(service)}`
}

export const getWiremockHost = getHost
export const getWiremockPort = getPort
export type { WiremockService }
