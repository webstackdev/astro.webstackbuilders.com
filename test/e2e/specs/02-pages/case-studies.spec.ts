/**
 * Case Studies List Page E2E Tests
 * Tests for /case-studies index page
 */
import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Case Studies List Page', () => {
  test('@ready mouse click on case study cards does not show focus-visible outline', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const cardSelector = 'article'
    const linkSelector = 'article a'

    await page.goto('/case-studies')

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
    await page.goto('/case-studies')
    await page.expectTitle(/Case Studies/)
  })

  test('@ready hero section displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectHeading()
    await page.expectTextContains('h1', /Case Studies/)
  })

  test('@ready case studies list displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectElementVisible('.case-study-item, article')
  })

  test('@ready case study cards have required elements', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectCaseStudyCard()
  })

  test('@ready case study links are functional', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectAttribute('.case-study-item a, article a', 'href')
  })

  test('@ready clicking case study navigates to detail page', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.click('.case-study-item a, article a')
    await page.expectUrl(/\/case-studies\/.+/)
  })

  test('@ready page is responsive on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/case-studies')
    await page.expectHeading()
    await page.expectElementVisible('.case-study-item, article')
  })

  test('@ready page has no console errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectNoErrors()
  })
})
