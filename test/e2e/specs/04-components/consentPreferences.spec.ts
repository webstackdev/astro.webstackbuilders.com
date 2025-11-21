/**
 * Consent Preferences Component Tests
 * Exercises the testing route so the modal can be covered in isolation
 */

import { BasePage, expect, test } from '@test/e2e/helpers'

const ALLOW_ALL_BUTTON = '#consent-allow-all'
const SAVE_BUTTON = '#consent-save-preferences'
const MODAL_SELECTOR = '#consent-modal-modal-id'
const CLOSE_BUTTON = '[data-testid="consent-preferences-close"]'

const toggleLabel = (checkboxId: string): string => `[data-consent-toggle="${checkboxId}"]`

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

async function openConsentPreferences(page: BasePage): Promise<void> {
  await page.locator('consent-preferences').waitFor({ state: 'attached' })
  await page.evaluate(() => {
    const element = document.querySelector<HTMLElement & { showModal?: () => void }>('consent-preferences')
    element?.showModal?.()
  })
  await page.locator(MODAL_SELECTOR).waitFor({ state: 'visible' })
}

test.describe('Consent Preferences Component', () => {
  test.beforeEach(async ({ page: playwrightPage, context }) => {
    const page = await BasePage.init(playwrightPage)
    await context.clearCookies()
    await page.goto('/testing/consent-preferences', { timeout: 15000 })
    await playwrightPage.waitForLoadState('networkidle')
    await removeViteErrorOverlay(page)
  })

  test('@ready modal renders headings and CTAs', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await openConsentPreferences(page)

    await expect(page.locator(MODAL_SELECTOR)).toBeVisible()
    await expect(page.locator('h2:has-text("Privacy Preference Center")')).toBeVisible()
    await expect(page.locator(CLOSE_BUTTON)).toBeVisible()
    await expect(page.locator(ALLOW_ALL_BUTTON)).toBeVisible()
    await expect(page.locator(SAVE_BUTTON)).toBeVisible()
  })

  test('@ready toggles can be updated and saved', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await openConsentPreferences(page)

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
    await expect(page.locator('text=Consent preferences saved successfully!')).toBeVisible()
  })

  test('@ready Allow All enables every category', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await openConsentPreferences(page)

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
