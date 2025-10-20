/**
 * Debug script to identify source of 404 errors
 *
 * DEBUG=true npx playwright test test/e2e/specs/debug-404s.spec.ts
 */
import { test } from '@playwright/test'

test('debug 404 sources', async ({ page }) => {
  const requests: any[] = []

  // Capture all requests with full details
  page.on('request', (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      initiator: request.frame().url(),
    })
  })

  page.on('response', (response) => {
    if (response.status() === 404) {
      const request = response.request()
      console.log('\n🔴 404 ERROR DETAILS:')
      console.log('  URL:', response.url())
      console.log('  Method:', request.method())
      console.log('  Resource Type:', request.resourceType())
      console.log('  Initiator Frame:', request.frame().url())
      console.log('  Headers:', JSON.stringify(request.headers(), null, 2))
    }
  })

  await page.goto('http://localhost:4321/')
  await page.waitForLoadState('networkidle')

  // Wait a bit more to catch any delayed requests
  await page.waitForTimeout(2000)

  console.log('\n✅ Test complete')
})
