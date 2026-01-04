/**
 * Newsletter Confirm Component E2E Tests
 *
 * Focuses on the confirmation UI component behavior.
 * Uses an unknown token to deterministically exercise the "expired" state.
 */
import { BasePage, expect, setupCleanTestPage, test } from '@test/e2e/helpers'
import { wait } from '@test/e2e/helpers/waitTimeouts'

test.use({ serviceWorkers: 'block' })

test.describe('Newsletter Confirm Component', () => {
  test('@ready shows expired state for unknown token', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    const token = `e2e-unknown-token-${Date.now()}`
    const confirmationPath = `/newsletter/confirm/${token}`

    await setupCleanTestPage(page.page, confirmationPath, { reloadStrategy: 'cacheBustingGoto' })

    const loadingState = page.locator('#loading-state')
    const expiredState = page.locator('#expired-state')
    const successState = page.locator('#success-state')
    const errorState = page.locator('#error-state')

    await expect(expiredState).toBeVisible({ timeout: wait.defaultWait })
    await expect(loadingState).toHaveClass(/hidden/, { timeout: wait.defaultWait })

    await expect(successState).toHaveClass(/hidden/)
    await expect(errorState).toHaveClass(/hidden/)

    await expect(page.locator('#confirm-heading-expired')).toBeFocused({ timeout: wait.defaultWait })
    await expect(page.locator('#confirmation-status')).toContainText(/expired/i)
  })
})
