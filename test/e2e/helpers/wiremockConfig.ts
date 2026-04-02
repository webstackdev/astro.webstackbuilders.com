import { env } from 'node:process'

type WiremockService = 'resend' | 'hubspot'

const getHost = () => env['WIREMOCK_HOST'] ?? '127.0.0.1'

const getPort = (service: WiremockService) => {
  const defaults: Record<WiremockService, number> = {
    resend: 9011,
    hubspot: 9012,
  }

  const envKeyMap: Record<WiremockService, string> = {
    resend: 'RESEND_HTTP_PORT',
    hubspot: 'HUBSPOT_HTTP_PORT',
  }

  return Number(env[envKeyMap[service]] ?? defaults[service])
}

export const buildWiremockBaseUrl = (service: WiremockService) => {
  return `http://${getHost()}:${getPort(service)}`
}

export const getWiremockHost = getHost
export const getWiremockPort = getPort
export type { WiremockService }
