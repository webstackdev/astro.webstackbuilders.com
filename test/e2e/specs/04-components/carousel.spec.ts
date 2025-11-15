/**
 * Carousel Component Tests
 * Tests for Embla carousel functionality including navigation, autoplay, and responsiveness
 * @see src/components/Carousel/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Carousel Component', () => {
  test.beforeEach(async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')
  })

  test.skip('@wip carousel displays on homepage', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Carousel component should be visible
    const carousel = page.locator('[data-carousel]').first()
    await expect(carousel).toBeVisible()
  })

  test.skip('@wip carousel has navigation buttons', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Previous and next buttons should be visible
    const prevButton = page.locator('[data-carousel-prev]').first()
    const nextButton = page.locator('[data-carousel-next]').first()

    await expect(prevButton).toBeVisible()
    await expect(nextButton).toBeVisible()
  })

  test.skip('@wip can navigate to next slide', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Clicking next button should change the active slide
    const carousel = page.locator('[data-carousel]').first()
    const nextButton = page.locator('[data-carousel-next]').first()

    // Get initial active slide index
    const initialSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    await nextButton.click()
    await page.waitForTimeout(500) // Wait for transition

    const newSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    expect(newSlide).not.toBe(initialSlide)
  })

  test.skip('@wip can navigate to previous slide', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Clicking previous button should change the active slide
    const carousel = page.locator('[data-carousel]').first()
    const prevButton = page.locator('[data-carousel-prev]').first()
    const nextButton = page.locator('[data-carousel-next]').first()

    // Go to slide 2 first
    await nextButton.click()
    await page.waitForTimeout(500)

    const beforePrev = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    await prevButton.click()
    await page.waitForTimeout(500)

    const afterPrev = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    expect(afterPrev).not.toBe(beforePrev)
  })

  test.skip('@wip carousel has pagination dots', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Pagination indicators should be visible
    const pagination = page.locator('[data-carousel-pagination]').first()
    await expect(pagination).toBeVisible()

    const dots = pagination.locator('button')
    const dotCount = await dots.count()
    expect(dotCount).toBeGreaterThan(0)
  })

  test.skip('@wip can click pagination dot to jump to slide', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Clicking pagination dot should jump to that slide
    const carousel = page.locator('[data-carousel]').first()
    const pagination = page.locator('[data-carousel-pagination]').first()
    const dots = pagination.locator('button')

    // Click the third dot (if it exists)
    if ((await dots.count()) >= 3) {
      await dots.nth(2).click()
      await page.waitForTimeout(500)

      const activeSlide = await carousel.evaluate((el) => {
        return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
      })

      expect(activeSlide).toBe('2')
    }
  })

  test.skip('@wip carousel supports keyboard navigation', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Arrow keys should navigate carousel
    const carousel = page.locator('[data-carousel]').first()
    await carousel.focus()

    const initialSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500)

    const newSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    expect(newSlide).not.toBe(initialSlide)
  })

  test.skip('@wip carousel wraps around from last to first slide', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Navigating past last slide should wrap to first
    const carousel = page.locator('[data-carousel]').first()
    const nextButton = page.locator('[data-carousel-next]').first()
    const pagination = page.locator('[data-carousel-pagination]').first()
    const dots = pagination.locator('button')

    const totalSlides = await dots.count()

    // Click next until we reach the last slide
    for (let i = 0; i < totalSlides; i++) {
      await nextButton.click()
      await page.waitForTimeout(300)
    }

    // Should be back at first slide
    const activeSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    expect(activeSlide).toBe('0')
  })

  test.skip('@wip carousel is responsive on mobile', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Carousel should work on mobile viewports
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const carousel = page.locator('[data-carousel]').first()
    await expect(carousel).toBeVisible()

    // Touch swipe should work
    const carouselBox = await carousel.boundingBox()
    if (carouselBox) {
      await page.touchscreen.tap(carouselBox.x + carouselBox.width / 2, carouselBox.y + carouselBox.height / 2)
      await page.mouse.move(
        carouselBox.x + carouselBox.width / 2,
        carouselBox.y + carouselBox.height / 2
      )
      await page.mouse.down()
      await page.mouse.move(carouselBox.x + 50, carouselBox.y + carouselBox.height / 2)
      await page.mouse.up()
      await page.waitForTimeout(500)

      // Verify slide changed
      const activeSlide = await carousel.evaluate((el) => {
        return el.querySelector('[aria-current="true"]')
      })
      expect(activeSlide).not.toBeNull()
    }
  })

  test.skip('@flaky autoplay pauses on hover', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Autoplay should pause when user hovers
    // Note: Marked as flaky because timing-dependent
    const carousel = page.locator('[data-carousel]').first()

    const initialSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    // Hover over carousel
    await carousel.hover()

    // Wait longer than autoplay interval
    await page.waitForTimeout(5000)

    const afterHover = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    // Slide should not have changed during hover
    expect(afterHover).toBe(initialSlide)
  })
})
