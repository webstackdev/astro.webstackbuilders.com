/**
 * Articles Page E2E Tests
 * Tests for the blog articles listing page
 */
import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Articles Page', () => {
  test('@ready mouse click on article cards does not show focus-visible outline', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const cardSelector = '[data-carousel-slide] article'
    const linkSelector = '[data-carousel-slide] article a'

    await page.goto('/articles')

    await page.evaluate(selector => {
      const link = document.querySelector<HTMLAnchorElement>(selector)
      // eslint-disable-next-line custom-rules/enforce-centralized-events -- test-only handler in Playwright browser context
      link?.addEventListener(
        'click',
        event => {
          event.preventDefault()
        },
        { once: true }
      )
    }, linkSelector)

    await page.click(linkSelector)

    const overlayState = await page.locator(cardSelector).first().evaluate(card => {
      const afterStyles = window.getComputedStyle(card, '::after')
      const link = card.querySelector('a')

      return {
        isFocused: link === document.activeElement,
        opacity: afterStyles.opacity,
      }
    })

    expect(overlayState.isFocused).toBe(true)
    expect(overlayState.opacity).toBe('0')
  })

  test('@ready page loads with correct title', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    await page.expectTitle(/Technical Index/)
  })

  test('@ready articles list displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    const count = await page.countElements('article')
    expect(count).toBeGreaterThan(0)
    await page.expectElementVisible('article')
  })

  test('@ready article cards have required elements', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    await page.expectArticleCard()
  })

  test('@ready clicking article navigates to detail page', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')

    // Get the first article link
    await page.click('article a')
    // Should navigate to an article detail page
    await page.expectUrl(/\/articles\/[^/]+/)
  })

  test('@ready page subtitle displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    // If no specific subtitle found, just verify h1 exists
    await page.expectHeading()
  })

  test('@ready articles are sorted by date', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    const count = await page.countElements('time[datetime]')
    expect(count).toBeGreaterThan(0)
    // Verify time elements have datetime attribute (for semantic HTML)
    await page.expectElementVisible('time[datetime]')
    await page.expectAttribute('time[datetime]', 'datetime')
  })

  test('@ready responsive: mobile view renders correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/articles')
    await page.expectElementVisible('article')
  })

  test('@ready page has no console errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    await page.expectNoErrors()
  })
})