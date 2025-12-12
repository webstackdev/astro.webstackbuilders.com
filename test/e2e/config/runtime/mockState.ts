import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildWiremockBaseUrl } from '../../helpers/wiremockConfig'

type WiremockService = 'convertkit' | 'resend'

interface WiremockState {
  services: Record<WiremockService, { baseUrl: string }>
  generatedAt: string
}

const getStateFilePath = () => {
  const override = process.env['E2E_WIREMOCK_STATE_PATH']
  if (override) {
    return override
  }
  return path.join(process.cwd(), '.cache', 'wiremock-state.json')
}

const buildStatePayload = (): WiremockState => {
  const services: WiremockState['services'] = {
    convertkit: { baseUrl: buildWiremockBaseUrl('convertkit') },
    resend: { baseUrl: buildWiremockBaseUrl('resend') },
  }

  return {
    services,
    generatedAt: new Date().toISOString(),
  }
}

export const writeWiremockState = async () => {
  const stateFile = getStateFilePath()
  await mkdir(path.dirname(stateFile), { recursive: true })
  const payload = buildStatePayload()
  await writeFile(stateFile, JSON.stringify(payload, null, 2), 'utf8')
}

export const deleteWiremockState = async () => {
  const stateFile = getStateFilePath()
  await rm(stateFile, { force: true })
}
