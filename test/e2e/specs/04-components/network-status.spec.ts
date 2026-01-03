/**
 * Network Status Component Tests
 * Validates toast behavior and connection indicator updates using the testing fixture route
 * @see src/pages/testing/network-status.astro
 */

import type { Page } from '@playwright/test'
import { BasePage, expect, test } from '@test/e2e/helpers'

const NETWORK_STATUS_FIXTURE = {
  path: '/testing/network-status',
  toastSelector: '[data-network-status-toast]',
  indicatorSelector: '[data-testid="connection-indicator"]',
}

async function loadNetworkStatusFixture(playwrightPage: Page) {
  const page = await BasePage.init(playwrightPage)
  await page.goto(NETWORK_STATUS_FIXTURE.path)
  await page.waitForLoadState('networkidle')
  return page
}

async function dispatchConnectionEvent(page: BasePage, eventName: 'online' | 'offline') {
  await page.evaluate(name => {
    window.dispatchEvent(new Event(name))
  }, eventName)
}

test.describe('Network Status Component', () => {
  test('renders toast and connection indicator in testing fixture', async ({ page: playwrightPage }) => {
    const page = await loadNetworkStatusFixture(playwrightPage)
    const toast = page.locator(NETWORK_STATUS_FIXTURE.toastSelector)
    const indicator = page.locator(NETWORK_STATUS_FIXTURE.indicatorSelector)

    await expect(toast).toHaveClass(/hidden/)
    await expect(indicator).toHaveText('Online')
    await expect(indicator).toHaveClass(/text-green-600/)
  })

  test('updates connection status and shows toast after reconnection', async ({ page: playwrightPage }) => {
    const page = await loadNetworkStatusFixture(playwrightPage)
    const toast = page.locator(NETWORK_STATUS_FIXTURE.toastSelector)
    const indicator = page.locator(NETWORK_STATUS_FIXTURE.indicatorSelector)

    await dispatchConnectionEvent(page, 'offline')
    await expect(indicator).toHaveText('Offline')
    await expect(indicator).toHaveClass(/text-red-600/)
    await expect(toast).toHaveClass(/hidden/)

    await dispatchConnectionEvent(page, 'online')
    await expect(indicator).toHaveText('Online')
    await expect(indicator).toHaveClass(/text-green-600/)
    await expect(toast).not.toHaveClass(/hidden/)
  })
})
