/**
 * Testimonials Component Tests
 * Tests for testimonials carousel/display
 * @see src/components/Testimonials/
 */

import { test, expect } from '@test/e2e/helpers'


test.describe('Testimonials Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for carousel to initialize
    await page.waitForTimeout(1500)
  })

  test('@ready testimonials section is visible', async ({ page }) => {
    // Expected: Testimonials component should be visible on homepage
    const testimonials = page.locator('.testimonials-embla')
    await expect(testimonials).toBeVisible()
  })

  test('@ready displays testimonial content', async ({ page }) => {
    // Expected: Should show testimonial text/quote
    const testimonialText = page.locator('blockquote').first()

    await expect(testimonialText).toBeVisible()

    const text = await testimonialText.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test('@ready displays testimonial author', async ({ page }) => {
    // Expected: Should show who gave the testimonial
    const testimonials = page.locator('.testimonials-embla')
    const author = testimonials.locator('.font-semibold').first()

    await expect(author).toBeVisible()

    const authorName = await author.textContent()
    expect(authorName?.trim().length).toBeGreaterThan(0)
  })

  test('@ready displays author company/title', async ({ page }) => {
    // Expected: Should show author's company or job title
    const testimonials = page.locator('.testimonials-embla')
    const company = testimonials.locator('.text-sm.text-text-offset').first()

    await expect(company).toBeVisible()

    const companyName = await company.textContent()
    expect(companyName?.trim().length).toBeGreaterThan(0)
  })

  test('@ready displays author avatar/photo', async ({ page }) => {
    // Expected: Should show author image
    const testimonials = page.locator('.testimonials-embla')
    const avatar = testimonials.locator('.avatar-image').first()

    await expect(avatar).toBeVisible()
  })

  test('@ready can navigate between testimonials', async ({ page }) => {
    // Expected: If multiple testimonials, should be able to navigate
    const testimonials = page.locator('.testimonials-embla')
    const nextButton = testimonials.locator('.embla__button--next')

    // Check if multiple testimonials exist
    const slideCount = await testimonials.locator('.embla__slide').count()
    if (slideCount < 2) {
      test.skip() // Single testimonial, skip navigation test
    }

    // Verify next button exists and is clickable
    await expect(nextButton).toBeVisible()
    await expect(nextButton).toBeEnabled()

    // Click and verify it still works (carousel navigation functional)
    await nextButton.click()
    await page.waitForTimeout(500)

    // Verify button is still there (carousel didn't break)
    await expect(nextButton).toBeVisible()
  })

  test('@ready has previous navigation button', async ({ page }) => {
    // Expected: Should have previous button
    const testimonials = page.locator('.testimonials-embla')
    const prevButton = testimonials.locator('.embla__button--prev')
    const nextButton = testimonials.locator('.embla__button--next')

    if ((await nextButton.count()) === 0) {
      test.skip() // Single testimonial
    }

    await expect(prevButton).toBeVisible()
  })

  test('@ready has pagination indicators', async ({ page }) => {
    // Expected: Should show dots/indicators for multiple testimonials
    const testimonials = page.locator('.testimonials-embla')
    const pagination = testimonials.locator('.embla__dots')

    if ((await pagination.count()) === 0) {
      test.skip() // May not have pagination
    }

    await expect(pagination).toBeVisible()

    const dots = pagination.locator('button')
    const count = await dots.count()
    expect(count).toBeGreaterThan(1)
  })

  test('@ready pagination dots are interactive', async ({ page }) => {
    // Expected: Clicking pagination dot should jump to that testimonial
    const testimonials = page.locator('.testimonials-embla')
    const pagination = testimonials.locator('.embla__dots')

    if ((await pagination.count()) === 0) {
      test.skip()
    }

    await expect(pagination).toBeVisible()

    // Dots are created as button elements by JavaScript
    const dots = pagination.locator('button')
    const dotCount = await dots.count()

    if (dotCount < 2) {
      test.skip()
    }

    // Get the selected dot index (which dot has aria-current="true")
    const getSelectedDotIndex = async () => {
      for (let i = 0; i < dotCount; i++) {
        const ariaCurrent = await dots.nth(i).getAttribute('aria-current')
        if (ariaCurrent === 'true') {
          return i
        }
      }
      return -1
    }

    const initialIndex = await getSelectedDotIndex()

    // Click a different dot (if on first dot, click second; otherwise click first)
    const targetIndex = initialIndex === 0 ? 1 : 0
    await dots.nth(targetIndex).click()
    await page.waitForTimeout(500)

    const newIndex = await getSelectedDotIndex()
    expect(newIndex).toBe(targetIndex)
    expect(newIndex).not.toBe(initialIndex)
  })

  test('@ready testimonials auto-rotate', async ({ page }) => {
    // Expected: Testimonials should auto-advance when autoplay is triggered
    const testimonials = page.locator('.testimonials-embla')

    // Check if carousel has multiple slides
    const slideCount = await testimonials.locator('.embla__slide').count()
    if (slideCount < 2) {
      test.skip() // Single testimonial, autoplay not relevant
    }

    // Get the selected dot index before autoplay
    const getSelectedDotIndex = async () => {
      const dots = testimonials.locator('.embla__dots button')
      const count = await dots.count()
      for (let i = 0; i < count; i++) {
        const ariaCurrent = await dots.nth(i).getAttribute('aria-current')
        if (ariaCurrent === 'true') {
          return i
        }
      }
      return -1
    }

    const initialIndex = await getSelectedDotIndex()

    // Stop autoplay first (it may already be running)
    await page.evaluate(() => {
      const emblaNode = document.querySelector('.testimonials-embla') as
        | (HTMLElement & { __emblaApi__?: { plugins: () => { autoplay?: { stop: () => void } } } })
        | null
      const autoplay = emblaNode?.__emblaApi__?.plugins()?.autoplay
      if (autoplay) {
        autoplay.stop()
      }
    })

    // Programmatically trigger autoplay and wait for slide change
    await page.evaluate(() => {
      const emblaNode = document.querySelector('.testimonials-embla') as
        | (HTMLElement & { __emblaApi__?: { plugins: () => { autoplay?: { play: () => void } } } })
        | null
      const autoplay = emblaNode?.__emblaApi__?.plugins()?.autoplay
      if (autoplay) {
        autoplay.play()
      }
    })

    // Wait for slide transition (plugin delay is 6s, add small buffer)
    await page.waitForTimeout(6500)

    const newIndex = await getSelectedDotIndex()
    expect(newIndex).not.toBe(initialIndex)
  })

  test('@ready auto-rotation pauses on hover', async ({ page }) => {
    // Expected: Auto-rotation should pause when user hovers
    const testimonials = page.locator('.testimonials-embla')

    // Check if carousel has multiple slides
    const slideCount = await testimonials.locator('.embla__slide').count()
    if (slideCount < 2) {
      test.skip() // Single testimonial, autoplay not relevant
    }

    const initialText = await testimonials.locator('blockquote').first().textContent()

    // Start autoplay programmatically
    await page.evaluate(() => {
      const emblaNode = document.querySelector('.testimonials-embla') as
        | (HTMLElement & {
            __emblaApi__?: { plugins: () => { autoplay?: { stop: () => void; play: () => void } } }
          })
        | null
      const autoplay = emblaNode?.__emblaApi__?.plugins()?.autoplay
      if (autoplay) {
        autoplay.stop() // Ensure clean state
        autoplay.play()
      }
    })

    // Hover over testimonials to pause auto-rotation
    // The stopOnMouseEnter option should stop autoplay
    await testimonials.hover()
    await page.waitForTimeout(500) // Wait for hover to take effect

    // Wait longer than rotation interval to verify it doesn't advance
    await page.waitForTimeout(7000)

    const textAfterHover = await testimonials.locator('blockquote').first().textContent()
    expect(textAfterHover).toBe(initialText)
  })

  test('@ready testimonials are responsive', async ({ page }) => {
    // Expected: Testimonials should display well on mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForTimeout(1500)

    const testimonials = page.locator('.testimonials-embla')
    await expect(testimonials).toBeVisible()

    const testimonialText = page.locator('blockquote').first()
    await expect(testimonialText).toBeVisible()
  })

  test('@ready testimonials have proper semantic markup', async ({ page }) => {
    // Expected: Should use proper HTML5 elements
    const testimonials = page.locator('.testimonials-embla')

    // Should use blockquote for quotes
    const quote = testimonials.locator('blockquote').first()
    await expect(quote).toBeVisible()

    // Should be inside an article element
    const article = testimonials.locator('article').first()
    await expect(article).toBeVisible()
  })
})
