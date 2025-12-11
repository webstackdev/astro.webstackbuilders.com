import type { FullConfig } from '@playwright/test'
import { stopWiremock } from './runtime/wiremock'

async function globalTeardown(_config: FullConfig) {
  await stopWiremock()
}

export default globalTeardown
