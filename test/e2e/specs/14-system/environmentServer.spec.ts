/**
 * E2E Regression Tests for Server Environment Detection
 *
 * @see src/lib/config/environmentServer.ts
 */

import { test, expect } from '@test/e2e/helpers'
import { isProd } from '@lib/config/environmentServer'

test.describe('Server Environment Detection Regression', () => {
  test('server version of isProd should return false in node context from Playwright test case', async () => {
    expect(isProd()).toBe(false)
  })
})