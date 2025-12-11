import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { containersEnvFile, wiremockComposeFile } from './paths'
import { buildWiremockBaseUrl } from '../../helpers/wiremockConfig'

const withCommand = (args: string[]) => {
  return ['compose', '--env-file', containersEnvFile, '-f', wiremockComposeFile, ...args]
}

const runDocker = (args: string[]) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('docker', withCommand(args), {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    child.on('error', (error) => reject(error))
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`docker ${args.join(' ')} exited with code ${code}`))
      }
    })
  })
}

const waitForHealthy = async (service: 'convertkit' | 'resend', timeoutMs = 15000) => {
  const deadline = Date.now() + timeoutMs
  const url = `${buildWiremockBaseUrl(service)}/__admin/mappings`

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Keep polling
    }
    await delay(500)
  }

  throw new Error(`${service} mock did not become healthy within ${timeoutMs}ms`)
}

export const startWiremock = async () => {
  await runDocker(['up', '-d', 'convertkit-mock', 'resend-mock'])
  await waitForHealthy('convertkit')
  await waitForHealthy('resend')
}

export const stopWiremock = async () => {
  try {
    await runDocker(['down'])
  } catch (error) {
    console.warn('Failed to stop Wiremock containers', error)
  }
}
