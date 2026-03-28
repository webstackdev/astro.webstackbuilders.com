/**
 * Calendar component tests
 * Covers the dedicated testing fixture for the Add to Calendar menu and download actions.
 */

import { readFile } from 'node:fs/promises'
import { BasePage, expect, test } from '@test/e2e/helpers'

const fixturePath = '/testing/calendar'
const componentSelector = '[data-testid="add-to-calendar"]'
const triggerSelector = `${componentSelector} [data-calendar-trigger]`
const menuSelector = `${componentSelector} [data-calendar-menu]`
const googleLinkSelector = `${componentSelector} [data-calendar-link="google"]`
const outlookLinkSelector = `${componentSelector} [data-calendar-link="outlook"]`
const downloadButtonSelector = `${componentSelector} [data-calendar-download-ics]`

const loadCalendarFixture = async (playwrightPage: Parameters<typeof BasePage.init>[0]) => {
  const page = await BasePage.init(playwrightPage)
  await page.goto(fixturePath)
  await expect(page.locator(componentSelector)).toBeVisible()
  return page
}

test.describe('Calendar Component', () => {
  test('@ready renders the testing fixture with a collapsed calendar menu', async ({ page: playwrightPage }) => {
    const page = await loadCalendarFixture(playwrightPage)

    await expect(playwrightPage.getByRole('heading', { name: 'Calendar Component Test Fixture' })).toBeVisible()
    await expect(page.locator(triggerSelector)).toHaveText(/Add to calendar/i)
    await expect(page.locator(menuSelector)).toHaveClass(/hidden/)
    await expect(page.locator(triggerSelector)).toHaveAttribute('aria-expanded', 'false')
  })

  test('@ready toggles the menu and populates Google and Outlook links from fixture metadata', async ({
    page: playwrightPage,
  }) => {
    const page = await loadCalendarFixture(playwrightPage)

    await page.locator(triggerSelector).click()

    await expect(page.locator(menuSelector)).not.toHaveClass(/hidden/)
    await expect(page.locator(triggerSelector)).toHaveAttribute('aria-expanded', 'true')

    const googleHref = await page.locator(googleLinkSelector).getAttribute('href')
    expect(googleHref).toBeTruthy()

    if (googleHref) {
      const googleUrl = new URL(googleHref)
      expect(googleUrl.hostname).toContain('calendar.google.com')
      expect(googleUrl.pathname).toBe('/calendar/render')
      expect(googleUrl.searchParams.get('action')).toBe('TEMPLATE')
      expect(googleUrl.searchParams.get('text')).toBe('Team sync')
      expect(googleUrl.searchParams.get('dates')).toBe('20300102T130000Z/20300102T140000Z')
      expect(googleUrl.searchParams.get('details')).toBe('Weekly team sync')
      expect(googleUrl.searchParams.get('location')).toBe('Remote')
    }

    const outlookHref = await page.locator(outlookLinkSelector).getAttribute('href')
    expect(outlookHref).toBeTruthy()

    if (outlookHref) {
      const outlookUrl = new URL(outlookHref)
      expect(outlookUrl.hostname).toContain('outlook.office.com')
      expect(outlookUrl.pathname).toBe('/calendar/0/deeplink/compose')
      expect(outlookUrl.searchParams.get('path')).toBe('/calendar/action/compose')
      expect(outlookUrl.searchParams.get('rru')).toBe('addevent')
      expect(outlookUrl.searchParams.get('subject')).toBe('Team sync')
      expect(outlookUrl.searchParams.get('startdt')).toBe('2030-01-02T13:00:00.000Z')
      expect(outlookUrl.searchParams.get('enddt')).toBe('2030-01-02T14:00:00.000Z')
      expect(outlookUrl.searchParams.get('body')).toBe('Weekly team sync')
      expect(outlookUrl.searchParams.get('location')).toBe('Remote')
    }

    await page.locator(triggerSelector).click()
    await expect(page.locator(menuSelector)).toHaveClass(/hidden/)
    await expect(page.locator(triggerSelector)).toHaveAttribute('aria-expanded', 'false')
  })

  test('@ready downloads an .ics file with the fixture event details', async ({ page: playwrightPage }) => {
    const page = await loadCalendarFixture(playwrightPage)

    await page.locator(triggerSelector).click()
    const downloadPromise = playwrightPage.waitForEvent('download')
    await page.locator(downloadButtonSelector).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('event.ics')
    const downloadPath = await download.path()
    expect(downloadPath).toBeTruthy()

    if (!downloadPath) {
      return
    }

    const icsText = await readFile(downloadPath, 'utf8')
    expect(icsText).toContain('BEGIN:VCALENDAR')
    expect(icsText).toContain('SUMMARY:Team sync')
    expect(icsText).toContain('DESCRIPTION:Weekly team sync')
    expect(icsText).toContain('LOCATION:Remote')
    expect(icsText).toContain('DTSTART:20300102T130000Z')
    expect(icsText).toContain('DTEND:20300102T140000Z')
    expect(icsText).toContain('END:VCALENDAR')

    await expect(page.locator(menuSelector)).toHaveClass(/hidden/)
    await expect(page.locator(triggerSelector)).toHaveAttribute('aria-expanded', 'false')
  })
})