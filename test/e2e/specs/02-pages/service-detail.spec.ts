/**
 * Service Detail Page E2E Tests
 * Tests for individual service pages using baseTest fixtures
 */
import { BasePage, test } from '@test/e2e/helpers'

test.describe('Service Detail Pages @ready', () => {
  test('first service page loads with content', async ({ page: playwrightPage, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    const page = new BasePage(playwrightPage)
    await page.goto(firstService)
    await page.expectMainElement()
    await page.expectHeading()
    await page.expectElementVisible('article[itemscope]')
  })

  test('first service title displays correctly', async ({ page: playwrightPage, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    const page = new BasePage(playwrightPage)
    await page.goto(firstService)
    await page.expectElementVisible('h1#article-title')
    await page.expectElementNotEmpty('h1#article-title')
  })

  test('first service content renders', async ({ page: playwrightPage, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    const page = new BasePage(playwrightPage)
    await page.goto(firstService)
    await page.expectElementVisible('article p')
  })

  test('first service page has no console errors', async ({ page: playwrightPage, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    const page = new BasePage(playwrightPage)
    await page.goto(firstService)
    await page.expectNoErrors()
  })

  test('first service page has no 404 errors', async ({ page: playwrightPage, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    const page = new BasePage(playwrightPage)
    await page.goto(firstService)
    await page.expectNoErrors()
  })
})
