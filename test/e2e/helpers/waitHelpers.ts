/**
 * Browser wait utilities for Playwright tests
 * Provides deterministic alternatives to deprecated timeout-based waits
 */
import type { Page } from '@playwright/test'

const THEME_PICKER_READY_ATTR = 'data-theme-picker-ready'
const NAVIGATION_READY_ATTR = 'data-nav-ready'
const DEFAULT_COMPONENT_READY_TIMEOUT = 5000

const isContextDestroyedError = (error: unknown) => {
  if (!(error instanceof Error)) return false
  const message = error.message ?? ''
  return message.includes('Execution context was destroyed') || message.includes('Target closed')
}

/**
 * Wait for the browser to render a specific number of animation frames
 * Uses requestAnimationFrame so it synchronizes with real layout/paint updates
 */
export async function waitForAnimationFrames(page: Page, frameCount: number = 2): Promise<void> {
  let remaining = frameCount

  while (remaining > 0) {
    try {
      await page.evaluate(async () => {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      })
      remaining -= 1
    } catch (error) {
      if (isContextDestroyedError(error)) {
        // NOTE: Prefer domcontentloaded as a reliable recovery point (networkidle can hang on WebKit/mobile-safari).
        await page.waitForLoadState('domcontentloaded')
        continue
      }
      throw error
    }
  }
}

export async function waitForThemePickerReady(page: Page, timeout = DEFAULT_COMPONENT_READY_TIMEOUT): Promise<void> {
  await page.waitForFunction(
    attr => document.querySelector('theme-picker')?.getAttribute(attr) === 'true',
    THEME_PICKER_READY_ATTR,
    { timeout }
  )
}

export async function waitForNavigationReady(page: Page, timeout = DEFAULT_COMPONENT_READY_TIMEOUT): Promise<void> {
  await page.waitForFunction(
    attr => document.querySelector('site-navigation')?.getAttribute(attr) === 'true',
    NAVIGATION_READY_ATTR,
    { timeout }
  )
}

export async function waitForHeaderComponents(page: Page, timeout = DEFAULT_COMPONENT_READY_TIMEOUT): Promise<void> {
  await Promise.all([
    waitForThemePickerReady(page, timeout),
    waitForNavigationReady(page, timeout),
  ])
}
