/**
 * WCAG Compliance Tests
 *
 * Axe detects if form error indicators are technically accessible to assistive
 * technologies like screen readers. A manual check is necessary to confirm that
 * correctly entered information remains in the form after a validation error.
 * When a page reloads after a server-side error, a manual test is needed to
 * ensure that focus is moved to the top of the form or the first field with an
 * error. For client-side validation, a manual check confirms that focus shifts
 * to the invalid field or an error summary.
 */
import { BasePage, describe, test, expect } from '@test/e2e/helpers'
import { wait } from '@test/e2e/helpers/waitTimeouts'

describe('WCAG Compliance', () => {
  test.skip('@wip form errors are clearly identified', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/contact')

    const submitButton = page.page.locator('button[type="submit"]').first()
    await submitButton.click()
    const errors = page.page.locator('[data-error], .error, [role="alert"]')
    await errors.first().waitFor({ state: 'visible', timeout: wait.quickAssert })
    const count = await errors.count()

    expect(count).toBeGreaterThan(0)

    // Error should be descriptive
    const errorText = await errors.first().textContent()
    expect(errorText?.trim().length).toBeGreaterThan(5)
  })
})
