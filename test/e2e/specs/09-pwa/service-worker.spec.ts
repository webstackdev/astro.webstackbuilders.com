/**
 * Service Worker Tests - Must be QA'd manually
 *
 * Note: Automated testing of service workers is not feasible in this E2E test suite
 * due to limitations with the Astro build process and Vercel adapter.
 */

import { test } from '@test/e2e/helpers'

test.describe('Service Worker', () => {
  test.fixme('@ready service worker cannot be tested in automated E2E tests and must be QAed manually, because the @vite-pwa/astro integration that generates sw.js runs on the astro:build:done so that it has access to all generated build artifacts. The Vercel adapter for Astro is incompatible with astro serve, so it is not possible to test against a built environment.', async () => {})
})
