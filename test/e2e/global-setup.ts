import type { FullConfig } from '@playwright/test'

async function globalSetup(_config: FullConfig) {
  // Mark as Playwright environment
  process.env['PLAYWRIGHT'] = 'true'

  // Mock environment variables for consistency with vitest.config.ts
  // These are used by import.meta.env in the browser context
  process.env['DEV'] = 'true'
  process.env['MODE'] = 'test'
  process.env['NODE_ENV'] = 'development'
  process.env['PROD'] = 'false'
}

export default globalSetup
