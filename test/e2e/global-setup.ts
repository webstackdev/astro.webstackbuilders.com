import type { FullConfig } from '@playwright/test'

async function globalSetup(_config: FullConfig) {
  process.env['PLAYWRIGHT'] = 'true'
}

export default globalSetup
