/**
 * Carousel Component E2E coverage
 * Focuses on the core UX guarantees of the Embla-powered slider rendered on case study detail pages.
 */

import { BasePage, test, expect } from '@test/e2e/helpers'
import { EvaluationError } from '@test/errors'
import { waitForAnimationFrames } from '@test/e2e/helpers/waitHelpers'
import type { Page } from '@playwright/test'

const selectors = {
  slider: 'carousel-slider[data-carousel]',
  prev: '[data-carousel-prev]',
  next: '[data-carousel-next]',
  dots: '[data-carousel-pagination] button',
}

async function setupCarouselTestPage(playwrightPage: Page): Promise<BasePage> {
  const page = await BasePage.init(playwrightPage)
  await page.page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/testing/carousel')
  await page.waitForSelector(selectors.slider)
  await waitForCarouselReady(page)
  await page.scrollToElement(selectors.slider)
  return page
}

async function waitForCarouselReady(page: BasePage): Promise<void> {
  await page.waitForFunction(() => {
    const slider = document.querySelector('carousel-slider[data-carousel]')
    return slider?.getAttribute('data-carousel-ready') === 'true'
  })
}

async function getActiveDotIndex(page: BasePage): Promise<number | null> {
  return await page.evaluate(() => {
    const slider = document.querySelector('carousel-slider[data-carousel]')
    const pagination = slider?.querySelector('[data-carousel-pagination]')
    const activeDot = pagination?.querySelector('button[aria-current="true"]')
    const index = activeDot?.getAttribute('data-index')
    return typeof index === 'string' ? Number(index) : null
  })
}

async function invokeCarouselControl(page: BasePage, action: 'pause' | 'resume'): Promise<void> {
  await page.evaluate((method) => {
    const slider = document.querySelector('carousel-slider[data-carousel]') as HTMLElement & {
      pause?: () => void
      resume?: () => void
    } | null

    if (slider && typeof slider[method] === 'function') {
      slider[method]()
    }
  }, action)
}

function assertIndex(value: number | null): asserts value is number {
  if (value === null) {
    throw new EvaluationError('Carousel did not report an active pagination dot')
  }
}

test.describe('Carousel Component', () => {
  test('displays slides, navigation controls, and pagination', async ({ page: playwrightPage }) => {
    const page = await setupCarouselTestPage(playwrightPage)
    const slider = page.locator(selectors.slider).first()
    const prevButton = slider.locator(selectors.prev)
    const nextButton = slider.locator(selectors.next)
    const dots = slider.locator(selectors.dots)

    await expect(slider).toBeVisible()
    await expect(prevButton).toBeVisible()
    await expect(nextButton).toBeVisible()

    const dotCount = await dots.count()
    expect(dotCount).toBeGreaterThan(1)

    const slideCount = await slider.locator('[data-carousel-slide]').count()
    expect(slideCount).toBeGreaterThan(1)
  })

  test('navigation buttons cycle through slides', async ({ page: playwrightPage }) => {
    const page = await setupCarouselTestPage(playwrightPage)
    const slider = page.locator(selectors.slider).first()
    const nextButton = slider.locator(selectors.next)
    const prevButton = slider.locator(selectors.prev)

    const initialIndex = await getActiveDotIndex(page)
    assertIndex(initialIndex)
    await nextButton.click()
    await expect.poll(async () => await getActiveDotIndex(page)).not.toBe(initialIndex)

    const afterNext = await getActiveDotIndex(page)
    assertIndex(afterNext)
    await prevButton.click()
    await expect.poll(async () => await getActiveDotIndex(page)).toBe(initialIndex)

    const afterPrev = await getActiveDotIndex(page)
    assertIndex(afterPrev)
    expect(afterPrev).toBe(initialIndex)
    expect(afterNext).not.toBe(initialIndex)
  })

  test('pagination dots jump to selected slide', async ({ page: playwrightPage }) => {
    const page = await setupCarouselTestPage(playwrightPage)
    const slider = page.locator(selectors.slider).first()
    const dots = slider.locator(selectors.dots)
    const dotTotal = await dots.count()

    expect(dotTotal).toBeGreaterThan(2)

    const targetIndex = dotTotal - 1
    await dots.nth(targetIndex).click()

    await expect.poll(async () => await getActiveDotIndex(page)).toBe(targetIndex)
  })

  test('autoplay exposes pause and resume controls', async ({ page: playwrightPage }) => {
    const page = await setupCarouselTestPage(playwrightPage)
    const slider = page.locator(selectors.slider).first()

    const initialIndex = await getActiveDotIndex(page)
    assertIndex(initialIndex)

    await invokeCarouselControl(page, 'resume')
    await expect(slider).toHaveAttribute('data-carousel-autoplay', 'playing')

    await invokeCarouselControl(page, 'pause')
    await expect(slider).toHaveAttribute('data-carousel-autoplay', 'paused')

    const pausedIndex = await getActiveDotIndex(page)
    assertIndex(pausedIndex)
    for (let iteration = 0; iteration < 3; iteration++) {
      await waitForAnimationFrames(page.page, 90)
      expect(await getActiveDotIndex(page)).toBe(pausedIndex)
    }

    await invokeCarouselControl(page, 'resume')
    await expect(slider).toHaveAttribute('data-carousel-autoplay', 'playing')
  })
})
