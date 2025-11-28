/**
 * Consent Preferences Component Tests
 * Exercises the consent route which hosts the consent-preferences component inline
 */

import { BasePage, expect, test } from '@test/e2e/helpers'

const ALLOW_ALL_BUTTON = '#consent-allow-all'
const SAVE_BUTTON = '#consent-save-preferences'
const COMPONENT_SELECTOR = 'consent-preferences'
const WIP_TAG = '@wip'
const CONSENT_PAGE_PATH = '/consent'

const toggleLabel = (checkboxId: string): string => `[data-consent-toggle="${checkboxId}"]`

async function interceptConsentApi(page: BasePage): Promise<void> {
  await page.route('**/api/gdpr/consent', async (route) => {
    const requestBody = route.request().postDataJSON?.() as Record<string, unknown> | undefined
    const purposes = Array.isArray(requestBody?.['purposes']) ? requestBody?.['purposes'] : []

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        record: {
          id: 'test-consent-record',
          DataSubjectId: (requestBody?.['DataSubjectId'] as string | undefined) ?? 'test-subject-id',
          purposes,
          timestamp: new Date().toISOString(),
          source: (requestBody?.['source'] as string | undefined) ?? 'cookies_modal',
          userAgent: (requestBody?.['userAgent'] as string | undefined) ?? 'playwright-test',
          ipAddress: '127.0.0.1',
          privacyPolicyVersion: 'test-policy-v1',
          verified: Boolean(requestBody?.['verified']),
        },
      }),
    })
  })
}

async function removeViteErrorOverlay(page: BasePage): Promise<void> {
  await page.evaluate(() => {
    const styleId = 'disable-vite-overlay-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        vite-error-overlay {
          pointer-events: none !important;
          opacity: 0 !important;
          display: none !important;
        }
      `
      document.head.append(style)
    }

    document.querySelectorAll('vite-error-overlay').forEach((element) => {
      element.remove()
    })
  })
}

async function waitForConsentPreferences(page: BasePage): Promise<void> {
  await page.locator(COMPONENT_SELECTOR).waitFor({ state: 'attached' })
  await page.waitForFunction(() => {
    const element = document.querySelector<HTMLElement>('consent-preferences')
    return element?.dataset?.['consentPreferencesReady'] === 'true'
  }, undefined, { timeout: 5_000 })
}

test.describe('Consent Preferences Component', () => {
  test.beforeEach(async ({ page: playwrightPage, context }, testInfo) => {
    const page = await BasePage.init(playwrightPage)
    const shouldMockConsentApi = !testInfo.title.includes(WIP_TAG)

    if (shouldMockConsentApi) {
      await interceptConsentApi(page)
    }

    await context.clearCookies()
    await page.goto(CONSENT_PAGE_PATH, { timeout: 15000 })
    await playwrightPage.waitForLoadState('networkidle')
    await removeViteErrorOverlay(page)
    await waitForConsentPreferences(page)
  })

  test.skip(
    '@wip full stack consent submission hits backend mocks',
    async ({ page: playwrightPage }) => {
      // This smoke test is intended to run against the local dev/mock Docker stack
      // (e.g., Supabase container) and therefore bypasses request interception.
      const page = await BasePage.init(playwrightPage)
      await page.goto(CONSENT_PAGE_PATH, { timeout: 15000 })
      await playwrightPage.waitForLoadState('networkidle')
      await waitForConsentPreferences(page)

      await page.locator(ALLOW_ALL_BUTTON).click()

      const consentRequest = page.waitForResponse('**/api/gdpr/consent')

      await page.locator(SAVE_BUTTON).click()

      const response = await consentRequest
      expect(response.ok()).toBeTruthy()

      await expect(page.locator('#analytics-cookies')).toBeChecked()
      await expect(page.locator('#functional-cookies')).toBeChecked()
      await expect(page.locator('#marketing-cookies')).toBeChecked()
    }
  )

  test('@ready component renders headings and CTAs', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await waitForConsentPreferences(page)

    await expect(page.locator(COMPONENT_SELECTOR)).toBeVisible()
    await expect(page.locator('consent-preferences h2:has-text("Privacy Preference Center")')).toBeVisible()
    await expect(page.locator('#consent-deny-all')).toBeVisible()
    await expect(page.locator(ALLOW_ALL_BUTTON)).toBeVisible()
    await expect(page.locator(SAVE_BUTTON)).toBeVisible()
  })

  test('@ready toggles can be updated and saved', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await waitForConsentPreferences(page)

    const analyticsCheckbox = page.locator('#analytics-cookies')
    const functionalCheckbox = page.locator('#functional-cookies')
    const marketingCheckbox = page.locator('#marketing-cookies')

    await page.locator(ALLOW_ALL_BUTTON).click()

    await page.locator(toggleLabel('analytics-cookies')).click()
    await page.locator(toggleLabel('functional-cookies')).click()
    await page.locator(toggleLabel('marketing-cookies')).click()

    await expect(analyticsCheckbox).not.toBeChecked()
    await expect(functionalCheckbox).not.toBeChecked()
    await expect(marketingCheckbox).not.toBeChecked()

    await page.locator(SAVE_BUTTON).click()
    await expect(analyticsCheckbox).not.toBeChecked()
    await expect(functionalCheckbox).not.toBeChecked()
    await expect(marketingCheckbox).not.toBeChecked()
  })

  test('@ready Allow All enables every category', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await waitForConsentPreferences(page)

    const analyticsCheckbox = page.locator('#analytics-cookies')
    const functionalCheckbox = page.locator('#functional-cookies')
    const marketingCheckbox = page.locator('#marketing-cookies')

    await page.locator(ALLOW_ALL_BUTTON).click()
    await page.locator(toggleLabel('functional-cookies')).click()
    await expect(functionalCheckbox).not.toBeChecked()

    await page.locator(ALLOW_ALL_BUTTON).click()

    await expect(analyticsCheckbox).toBeChecked()
    await expect(functionalCheckbox).toBeChecked()
    await expect(marketingCheckbox).toBeChecked()

  })
})
