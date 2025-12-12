import type { FullConfig } from '@playwright/test'
import { deleteWiremockState } from './runtime/mockState'
import { stopWiremock } from './runtime/wiremock'

async function globalTeardown(_config: FullConfig) {
  await stopWiremock()
  await deleteWiremockState()
}

export default globalTeardown
