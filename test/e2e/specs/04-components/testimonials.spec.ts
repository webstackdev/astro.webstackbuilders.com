/**
 * Testimonials Component Tests
 * Tests for testimonials carousel/display
 * @see src/components/Testimonials/
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('Testimonials Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.home)
  })

  test.skip('@wip testimonials section is visible', async ({ page }) => {
    // Expected: Testimonials component should be visible on homepage
    const testimonials = page.locator('[data-testimonials]')
    await expect(testimonials).toBeVisible()
  })

  test.skip('@wip displays testimonial content', async ({ page }) => {
    // Expected: Should show testimonial text/quote
    const testimonials = page.locator('[data-testimonials]')
    const testimonialText = testimonials.locator('[data-testimonial-text], blockquote').first()

    await expect(testimonialText).toBeVisible()

    const text = await testimonialText.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test.skip('@wip displays testimonial author', async ({ page }) => {
    // Expected: Should show who gave the testimonial
    const testimonials = page.locator('[data-testimonials]')
    const author = testimonials.locator('[data-testimonial-author]').first()

    await expect(author).toBeVisible()

    const authorName = await author.textContent()
    expect(authorName?.trim().length).toBeGreaterThan(0)
  })

  test.skip('@wip displays author company/title', async ({ page }) => {
    // Expected: Should show author's company or job title
    const testimonials = page.locator('[data-testimonials]')
    const company = testimonials.locator('[data-testimonial-company], [data-testimonial-title]').first()

    await expect(company).toBeVisible()

    const companyName = await company.textContent()
    expect(companyName?.trim().length).toBeGreaterThan(0)
  })

  test.skip('@wip displays author avatar/photo', async ({ page }) => {
    // Expected: Should show author image
    const testimonials = page.locator('[data-testimonials]')
    const avatar = testimonials.locator('[data-testimonial-avatar], img[alt*="testimonial"]').first()

    if ((await avatar.count()) > 0) {
      await expect(avatar).toBeVisible()
    }
  })

  test.skip('@wip can navigate between testimonials', async ({ page }) => {
    // Expected: If multiple testimonials, should be able to navigate
    const testimonials = page.locator('[data-testimonials]')
    const nextButton = testimonials.locator('[data-testimonials-next]').first()

    if ((await nextButton.count()) === 0) {
      test.skip() // Single testimonial, skip navigation test
    }

    await expect(nextButton).toBeVisible()

    const initialText = await testimonials.locator('[data-testimonial-text]').first().textContent()

    await nextButton.click()
    await page.waitForTimeout(500)

    const newText = await testimonials.locator('[data-testimonial-text]').first().textContent()
    expect(newText).not.toBe(initialText)
  })

  test.skip('@wip has previous navigation button', async ({ page }) => {
    // Expected: Should have previous button
    const testimonials = page.locator('[data-testimonials]')
    const prevButton = testimonials.locator('[data-testimonials-prev]').first()
    const nextButton = testimonials.locator('[data-testimonials-next]').first()

    if ((await nextButton.count()) === 0) {
      test.skip() // Single testimonial
    }

    await expect(prevButton).toBeVisible()
  })

  test.skip('@wip has pagination indicators', async ({ page }) => {
    // Expected: Should show dots/indicators for multiple testimonials
    const testimonials = page.locator('[data-testimonials]')
    const pagination = testimonials.locator('[data-testimonials-pagination]').first()

    if ((await pagination.count()) === 0) {
      test.skip() // May not have pagination
    }

    await expect(pagination).toBeVisible()

    const dots = pagination.locator('button')
    const count = await dots.count()
    expect(count).toBeGreaterThan(1)
  })

  test.skip('@wip pagination dots are interactive', async ({ page }) => {
    // Expected: Clicking pagination dot should jump to that testimonial
    const testimonials = page.locator('[data-testimonials]')
    const pagination = testimonials.locator('[data-testimonials-pagination]').first()

    if ((await pagination.count()) === 0) {
      test.skip()
    }

    const dots = pagination.locator('button')
    if ((await dots.count()) < 2) {
      test.skip()
    }

    const initialText = await testimonials.locator('[data-testimonial-text]').first().textContent()

    // Click second dot
    await dots.nth(1).click()
    await page.waitForTimeout(500)

    const newText = await testimonials.locator('[data-testimonial-text]').first().textContent()
    expect(newText).not.toBe(initialText)
  })

  test.skip('@flaky testimonials auto-rotate', async ({ page }) => {
    // Expected: Testimonials should auto-advance
    // Marked as flaky due to timing dependency
    const testimonials = page.locator('[data-testimonials]')
    const nextButton = testimonials.locator('[data-testimonials-next]')

    if ((await nextButton.count()) === 0) {
      test.skip()
    }

    const initialText = await testimonials.locator('[data-testimonial-text]').first().textContent()

    // Wait for auto-rotation (typically 5-8 seconds)
    await page.waitForTimeout(8000)

    const newText = await testimonials.locator('[data-testimonial-text]').first().textContent()
    expect(newText).not.toBe(initialText)
  })

  test.skip('@flaky auto-rotation pauses on hover', async ({ page }) => {
    // Expected: Auto-rotation should pause when user hovers
    // Marked as flaky due to timing dependency
    const testimonials = page.locator('[data-testimonials]')
    const nextButton = testimonials.locator('[data-testimonials-next]')

    if ((await nextButton.count()) === 0) {
      test.skip()
    }

    const initialText = await testimonials.locator('[data-testimonial-text]').first().textContent()

    // Hover over testimonials
    await testimonials.hover()

    // Wait longer than rotation interval
    await page.waitForTimeout(10000)

    const textAfterHover = await testimonials.locator('[data-testimonial-text]').first().textContent()
    expect(textAfterHover).toBe(initialText)
  })

  test.skip('@wip testimonials are responsive', async ({ page }) => {
    // Expected: Testimonials should display well on mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(TEST_URLS.home)

    const testimonials = page.locator('[data-testimonials]')
    await expect(testimonials).toBeVisible()

    const testimonialText = testimonials.locator('[data-testimonial-text]').first()
    await expect(testimonialText).toBeVisible()
  })

  test.skip('@wip testimonials have proper semantic markup', async ({ page }) => {
    // Expected: Should use proper HTML5 elements
    const testimonials = page.locator('[data-testimonials]')

    // Should use blockquote for quotes
    const quote = testimonials.locator('blockquote').first()
    if ((await quote.count()) > 0) {
      await expect(quote).toBeVisible()
    }

    // Check for cite or figcaption for attribution
    const citation = testimonials.locator('cite, figcaption').first()
    if ((await citation.count()) > 0) {
      await expect(citation).toBeVisible()
    }
  })
})
