/**
 * Privacy "My Data" Form E2E Tests
 *
 * Focuses on client-side UX behavior for the privacy DSAR form.
 * Uses action endpoint mocking to keep assertions deterministic.
 */
import {
  BasePage,
  expect,
  mockFetchEndpointResponse,
  spyOnFetchEndpoint,
  test,
  setupCleanTestPage,
} from '@test/e2e/helpers'
import { wait } from '@test/e2e/helpers/waitTimeouts'
import { stringify as devalueStringify } from 'devalue'

const PRIVACY_MY_DATA_PATH = '/privacy/my-data'
const gdprRequestDataEndpoint = '/_actions/gdpr.requestData'

test.use({ serviceWorkers: 'block' })

test.describe('Privacy My Data Form', () => {
  test('@ready blocks delete submit when confirmation is unchecked', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await setupCleanTestPage(page.page, PRIVACY_MY_DATA_PATH, { reloadStrategy: 'cacheBustingGoto' })

    const requestSpy = await spyOnFetchEndpoint(playwrightPage, gdprRequestDataEndpoint)

    try {
      const email = `privacy-delete-${Date.now()}@example.com`

      await page.fill('#delete-email', email)
      await expect(page.locator('#confirm-delete')).not.toBeChecked()

      await page.click('#delete-form button[type="submit"]')

      const deleteMessage = page.locator('#delete-message')
      await expect(deleteMessage).toBeVisible({ timeout: wait.defaultWait })
      await expect(deleteMessage).toContainText('Please confirm you understand the deletion request.')
      await expect(deleteMessage).toBeFocused({ timeout: wait.defaultWait })

      const callCount = await requestSpy.getCallCount()
      await expect(callCount).toBe(0)
    } finally {
      await requestSpy.restore()
    }
  })

  test('@ready shows success message for access request when action returns success', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await setupCleanTestPage(page.page, PRIVACY_MY_DATA_PATH, { reloadStrategy: 'cacheBustingGoto' })

    const actionBody = devalueStringify({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    })

    const mockedResponse = await mockFetchEndpointResponse(playwrightPage, {
      endpoint: gdprRequestDataEndpoint,
      status: 200,
      body: actionBody,
    })

    try {
      const email = `privacy-access-${Date.now()}@example.com`
      await page.fill('#access-email', email)

      await page.click('#access-form button[type="submit"]')
      await mockedResponse.waitForCall(wait.defaultWait)

      const accessMessage = page.locator('#access-message')
      await expect(accessMessage).toBeVisible({ timeout: wait.defaultWait })
      await expect(accessMessage).toContainText('Verification email sent')
      await expect(accessMessage).toHaveClass(/border-success/, { timeout: wait.defaultWait })
      await expect(accessMessage).toBeFocused({ timeout: wait.defaultWait })

      await expect(page.locator('#access-email')).toHaveValue('')
    } finally {
      await mockedResponse.restore()
    }
  })
})
