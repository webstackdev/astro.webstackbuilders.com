/**
 * Browser wait utilities for Playwright tests
 * Provides deterministic alternatives to deprecated timeout-based waits
 */
import type { Page } from '@playwright/test'

/**
 * Wait for the browser to render a specific number of animation frames
 * Uses requestAnimationFrame so it synchronizes with real layout/paint updates
 */
export async function waitForAnimationFrames(page: Page, frameCount: number = 2): Promise<void> {
  await page.evaluate(async (count) => {
    for (let index = 0; index < count; index++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    }
  }, frameCount)
}
