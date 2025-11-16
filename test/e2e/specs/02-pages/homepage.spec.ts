/**
 * Homepage E2E Tests
 * Tests for the main landing page functionality
 */
import { BasePage, test } from '@test/e2e/helpers'

test.describe('Homepage', () => {
  test('@ready page loads with correct title', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectTitle(/Webstack Builders/)
  })

  test('@ready hero section displays correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    // Hero should be visible
    await page.expectHeroSection()

    // Should have h1
    await page.expectHeading()
  })

  test('@ready featured services section renders', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    // Check for Featured Services section - Carousel renders an h2 with the title
    await page.expectHasHeading('Featured Services')
  })

  test('@ready case studies section displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    // Check for Success Stories heading - appears twice (section h2 + carousel h2), use first
    await page.expectHasHeading('Success Stories')
  })

  test('@ready latest articles section renders', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    // Check for Latest Insights heading (appears twice: as section h2 and carousel title)
    await page.expectHasHeading('Latest Insights')
  })

  test('@ready testimonials section displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectTextVisible('What Clients Say')
  })

  test('@ready newsletter signup form present', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectNewsletterForm()
    await page.expectNewsletterEmailInput()
    await page.expectNewsletterGdpr()
  })

  test('@ready CTA sections are clickable', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    // Find CTA button - may be "Start a Conversation" or similar
    await page.expectCtaButton()
  })

  test('@ready responsive: mobile view renders correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    // Main content should still be visible
    await page.expectHeading()

    // Newsletter email input should be visible
    await page.expectNewsletterEmailInput()
  })

  test('@ready page has no console errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectNoErrors()
  })
})
