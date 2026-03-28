/**
 * Bug Reporter modal tests
 * Covers the footer-triggered bug report dialog and minimized state behavior.
 */

import { BasePage, expect, test } from '@test/e2e/helpers'

const fixturePath = '/testing/bug-reporter'
const triggerSelector = '#bugReporterFixtureTrigger'
const dialogSelector = '#bugReporterFixtureDialog'
const formSelector = '#bugReporterFixtureForm'
const cancelButtonSelector = '#bugReporterFixtureCancel'
const minimizeButtonSelector = '#bugReporterFixtureMinimize'
const minimizedBarSelector = '#bugReporterFixtureMinimizedBar'
const restoreButtonSelector = '#bugReporterFixtureRestore'
const minimizedCloseButtonSelector = '#bugReporterFixtureMinimizedClose'
const nameInputSelector = `${formSelector} input[name="name"]`
const emailInputSelector = `${formSelector} input[name="email"]`
const messageSelector = `${formSelector} textarea[name="message"]`

const openBugReporter = async (page: BasePage) => {
  const trigger = page.locator(triggerSelector)
  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(page.locator(dialogSelector)).toHaveAttribute('open', '')
  await expect(page.locator(nameInputSelector)).toBeVisible()
}

test.describe('Bug Reporter Modal', () => {
  test('@ready opens from the fixture trigger with labeled fields', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(fixturePath, { skipCookieDismiss: true })

    await openBugReporter(page)

    const nameInput = page.locator(nameInputSelector)
    const emailInput = page.locator(emailInputSelector)
    const messageInput = page.locator(messageSelector)

    await expect(page.locator(dialogSelector)).toHaveAttribute('open', '')
    await expect(playwrightPage.getByRole('heading', { name: 'Report a bug' })).toBeVisible()
    await expect(nameInput).toBeFocused()
    await expect(nameInput).toHaveAccessibleName('Name')
    await expect(emailInput).toHaveAccessibleName('Email')
    await expect(messageInput).toHaveAccessibleName('Description')
  })

  test('@ready cancel closes the modal and clears entered form state', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(fixturePath, { skipCookieDismiss: true })

    await openBugReporter(page)

    const nameInput = page.locator(nameInputSelector)
    const emailInput = page.locator(emailInputSelector)
    const messageInput = page.locator(messageSelector)

    await nameInput.fill('Test User')
    await emailInput.fill('test@example.com')
    await messageInput.fill('Modal reset check')

    await page.locator(cancelButtonSelector).click()
    await expect(page.locator(dialogSelector)).not.toHaveAttribute('open', '')

    await openBugReporter(page)

    await expect(nameInput).toHaveValue('')
    await expect(emailInput).toHaveValue('')
    await expect(messageInput).toHaveValue('')
  })

  test('@ready minimize preserves draft state and minimized close clears it', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(fixturePath, { skipCookieDismiss: true })

    await openBugReporter(page)

    const messageInput = page.locator(messageSelector)
    await messageInput.fill('Bug details in progress')

    await page.locator(minimizeButtonSelector).click()
    await expect(page.locator(dialogSelector)).not.toHaveAttribute('open', '')
    await expect(page.locator(minimizedBarSelector)).toBeVisible()

    await page.locator(restoreButtonSelector).click()
    await expect(page.locator(dialogSelector)).toHaveAttribute('open', '')
    await expect(messageInput).toHaveValue('Bug details in progress')

    await page.locator(minimizeButtonSelector).click()
    await expect(page.locator(minimizedBarSelector)).toBeVisible()
    await page.locator(minimizedCloseButtonSelector).click()
    await expect(page.locator(minimizedBarSelector)).toBeHidden()

    await openBugReporter(page)
    await expect(messageInput).toHaveValue('')
  })
})