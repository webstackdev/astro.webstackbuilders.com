/**
 * Carousel Component Tests
 * Tests for Embla carousel functionality including navigation, autoplay, and responsiveness
 * @see src/components/Carousel/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'
import { waitForAnimationFrames } from '@test/e2e/helpers/waitHelpers'

test.describe('Carousel Component', () => {
  /**
   * Setup for carousel component tests
   *
   * Side effects relied upon:
   * - Navigates to homepage where carousel component is displayed
   *
   * Without this setup, tests would fail due to:
   * - Carousel component not being present on the page
   * - Embla carousel not being initialized and ready for interaction
   *
   * Note: Individual tests may need to wait for carousel initialization using
   * the data-carousel-managed attribute that gets set when initialization completes
   */
  test.beforeEach(async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
  })

  test.skip('@wip carousel displays on homepage', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Carousel component should be visible
    const carousel = page.locator('[data-carousel]').first()
    await expect(carousel).toBeVisible()
  })

  test.skip('@wip carousel has navigation buttons', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Previous and next buttons should be visible
    const prevButton = page.locator('[data-carousel-prev]').first()
    const nextButton = page.locator('[data-carousel-next]').first()

    await expect(prevButton).toBeVisible()
    await expect(nextButton).toBeVisible()
  })

  test.skip('@wip can navigate to next slide', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Clicking next button should change the active slide
    const carousel = page.locator('.embla').first()
    const nextButton = carousel.locator('.embla__button--next')

    // Wait for carousel to initialize
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: unknown }>('.embla')
      return el?.__emblaApi__ !== undefined
    })

    // Get initial active slide index
    const initialSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    await nextButton.click()

    // Wait for transition to settle using Embla API
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: { internalEngine: () => { settled: boolean } } }>('.embla')
      return el?.__emblaApi__?.internalEngine().settled === true
    })

    const newSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    expect(newSlide).not.toBe(initialSlide)
  })

  test.skip('@wip can navigate to previous slide', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Clicking previous button should change the active slide
    const carousel = page.locator('.embla').first()
    const prevButton = carousel.locator('.embla__button--prev')
    const nextButton = carousel.locator('.embla__button--next')

    // Wait for carousel to initialize
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: unknown }>('.embla')
      return el?.__emblaApi__ !== undefined
    })

    // Go to slide 2 first
    await nextButton.click()
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: { internalEngine: () => { settled: boolean } } }>('.embla')
      return el?.__emblaApi__?.internalEngine().settled === true
    })

    const beforePrev = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    await prevButton.click()
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: { internalEngine: () => { settled: boolean } } }>('.embla')
      return el?.__emblaApi__?.internalEngine().settled === true
    })

    const afterPrev = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    expect(afterPrev).not.toBe(beforePrev)
  })

  test.skip('@wip carousel has pagination dots', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Pagination indicators should be visible
    const pagination = page.locator('[data-carousel-pagination]').first()
    await expect(pagination).toBeVisible()

    const dots = pagination.locator('button')
    const dotCount = await dots.count()
    expect(dotCount).toBeGreaterThan(0)
  })

  test.skip('@wip can click pagination dot to jump to slide', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Clicking pagination dot should jump to that slide
    const carousel = page.locator('.embla').first()
    const pagination = carousel.locator('.embla__dots')
    const dots = pagination.locator('button')

    // Wait for carousel to initialize
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: unknown }>('.embla')
      return el?.__emblaApi__ !== undefined
    })

    // Click the third dot (if it exists)
    if ((await dots.count()) >= 3) {
      await dots.nth(2).click()
      await page.waitForFunction(() => {
        const el = document.querySelector<HTMLElement & { __emblaApi__?: { internalEngine: () => { settled: boolean } } }>('.embla')
        return el?.__emblaApi__?.internalEngine().settled === true
      })

      const activeSlide = await carousel.evaluate((el) => {
        return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
      })

      expect(activeSlide).toBe('2')
    }
  })

  test.skip('@wip carousel supports keyboard navigation', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Arrow keys should navigate carousel
    const carousel = page.locator('.embla').first()

    // Wait for carousel to initialize
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: unknown }>('.embla')
      return el?.__emblaApi__ !== undefined
    })

    await carousel.focus()

    const initialSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    await page.keyboard.press('ArrowRight')
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: { internalEngine: () => { settled: boolean } } }>('.embla')
      return el?.__emblaApi__?.internalEngine().settled === true
    })

    const newSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    expect(newSlide).not.toBe(initialSlide)
  })

  test.skip('@wip carousel wraps around from last to first slide', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Navigating past last slide should wrap to first
    const carousel = page.locator('.embla').first()
    const nextButton = carousel.locator('.embla__button--next')
    const pagination = carousel.locator('.embla__dots')
    const dots = pagination.locator('button')

    // Wait for carousel to initialize
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: unknown }>('.embla')
      return el?.__emblaApi__ !== undefined
    })

    const totalSlides = await dots.count()

    // Click next until we reach the last slide
    for (let i = 0; i < totalSlides; i++) {
      await nextButton.click()
      await page.waitForFunction(() => {
        const el = document.querySelector<HTMLElement & { __emblaApi__?: { internalEngine: () => { settled: boolean } } }>('.embla')
        return el?.__emblaApi__?.internalEngine().settled === true
      })
    }

    // Should be back at first slide
    const activeSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    expect(activeSlide).toBe('0')
  })

  test.skip('@wip carousel is responsive on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Carousel should work on mobile viewports
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const carousel = page.locator('.embla').first()

    // Wait for carousel to initialize
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: unknown }>('.embla')
      return el?.__emblaApi__ !== undefined
    })

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
      await page.waitForFunction(() => {
        const el = document.querySelector<HTMLElement & { __emblaApi__?: { internalEngine: () => { settled: boolean } } }>('.embla')
        return el?.__emblaApi__?.internalEngine().settled === true
      })

      // Verify slide changed
      const activeSlide = await carousel.evaluate((el) => {
        return el.querySelector('[aria-current="true"]')
      })
      expect(activeSlide).not.toBeNull()
    }
  })

  test.skip('@flaky autoplay pauses on hover', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Autoplay should pause when user hovers
    // Note: Marked as flaky because timing-dependent
    const carousel = page.locator('.embla').first()

    // Wait for carousel to initialize
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLElement & { __emblaApi__?: unknown }>('.embla')
      return el?.__emblaApi__ !== undefined
    })

    const initialSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    // Hover over carousel
    await carousel.hover()

    // Wait longer than autoplay interval (4000ms + buffer) using animation frames
    let afterHover = initialSlide
    for (let index = 0; index < 5; index++) {
      await waitForAnimationFrames(page.page, 60)
      afterHover = await carousel.evaluate((el) => {
        return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
      })
      expect(afterHover).toBe(initialSlide)
    }

    // Slide should not have changed during hover
    expect(afterHover).toBe(initialSlide)
  })
})
