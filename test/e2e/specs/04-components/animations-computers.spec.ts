import { BasePage, test, expect } from '@test/e2e/helpers'
import type { Page } from '@playwright/test'

type AnimationPlayState = 'playing' | 'paused' | null

const selectors = {
  host: 'computers-animation',
  toggle: '[data-animation-toggle]',
}

const overlaySource = 'e2e-computers-animation'

interface FixtureOptions {
  reducedMotion?: 'no-preference' | 'reduce'
}

const isMobileProject = (projectName: string): boolean => {
  return projectName.startsWith('mobile-')
}

async function loadComputersFixture(playwrightPage: Page, options: FixtureOptions = {}): Promise<BasePage> {
  const page = await BasePage.init(playwrightPage)
  await page.page.emulateMedia({ reducedMotion: options.reducedMotion ?? 'no-preference' })
  await page.goto('/testing/animations-computers')
  // NOTE: The component is intentionally `hidden lg:flex` in production markup.
  // On mobile projects it will remain hidden, so waiting for "visible" will hang.
  await page.waitForSelector(selectors.host, { state: 'attached' })
  await page.waitForSelector(selectors.toggle, { state: 'attached' })
  return page
}

async function getAnimationState(page: BasePage): Promise<AnimationPlayState> {
  return await page.evaluate(() => {
    return document.querySelector('computers-animation')?.getAttribute('data-animation-state') as AnimationPlayState
  })
}

async function waitForAnimationState(page: BasePage, expected: Exclude<AnimationPlayState, null>): Promise<void> {
  await expect.poll(async () => await getAnimationState(page)).toBe(expected)
}

async function getToggleAttributes(page: BasePage): Promise<{ label: string | null; pressed: string | null }> {
  return await page.evaluate((toggleSelector) => {
    const button = document.querySelector<HTMLButtonElement>(toggleSelector)
    return {
      label: button?.getAttribute('aria-label') ?? null,
      pressed: button?.getAttribute('aria-pressed') ?? null,
    }
  }, selectors.toggle)
}

async function setOverlayPause(page: BasePage, isPaused: boolean): Promise<void> {
  await page.evaluate(({ paused, source }) => {
    window.setOverlayPauseState?.(source, paused)
  }, { paused: isPaused, source: overlaySource })
}

test.describe('Computers Animation Component', () => {
  test('plays by default when no pause sources exist', async ({ page: playwrightPage }, testInfo) => {
    const page = await loadComputersFixture(playwrightPage)
    const host = page.locator(selectors.host)
    const toggle = page.locator(selectors.toggle)

    if (isMobileProject(testInfo.project.name)) {
      await expect(host).toBeHidden()
      await waitForAnimationState(page, 'paused')
      await expect(toggle).toHaveAttribute('aria-label', 'Play animation')
      await expect(toggle).toHaveAttribute('aria-pressed', 'true')
      return
    }

    await expect(host).toBeVisible()
    await waitForAnimationState(page, 'playing')
    await expect(toggle).toHaveAttribute('aria-label', 'Pause animation')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  test('honors prefers-reduced-motion by starting paused', async ({ page: playwrightPage }, testInfo) => {
    const page = await loadComputersFixture(playwrightPage, { reducedMotion: 'reduce' })
    const host = page.locator(selectors.host)

    await waitForAnimationState(page, 'paused')

    if (isMobileProject(testInfo.project.name)) {
      await expect(host).toBeHidden()
    } else {
      await expect(host).toBeVisible()
    }

    const toggleAttributes = await getToggleAttributes(page)
    expect(toggleAttributes.label).toBe('Play animation')
    expect(toggleAttributes.pressed).toBe('true')
  })

  test(
    'responds to overlay pause and resume actions from the animation store',
    async ({ page: playwrightPage }, testInfo) => {
    const page = await loadComputersFixture(playwrightPage)
    const host = page.locator(selectors.host)

    // On mobile projects the component is intentionally `hidden lg:flex` and must not start.
    // The lifecycle controller is irrelevant when the component is not shown.
    if (isMobileProject(testInfo.project.name)) {
      await expect(host).toBeHidden()
      await waitForAnimationState(page, 'paused')

      await setOverlayPause(page, true)
      await waitForAnimationState(page, 'paused')

      await setOverlayPause(page, false)
      await waitForAnimationState(page, 'paused')
      return
    }

    await waitForAnimationState(page, 'playing')

    await setOverlayPause(page, true)
    await waitForAnimationState(page, 'paused')

    let toggleAttributes = await getToggleAttributes(page)
    expect(toggleAttributes.label).toBe('Play animation')
    expect(toggleAttributes.pressed).toBe('true')

    await setOverlayPause(page, false)
    await waitForAnimationState(page, 'playing')

    toggleAttributes = await getToggleAttributes(page)
    expect(toggleAttributes.label).toBe('Pause animation')
    expect(toggleAttributes.pressed).toBe('false')
    }
  )
})
