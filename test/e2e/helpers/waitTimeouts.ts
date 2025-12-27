/**
 * Centralized timeout values for Playwright E2E tests.
 *
 * Why this exists:
 * - Keeps "how long do we wait?" decisions in one place.
 * - Makes it obvious which waits are deliberate vs. accidental copy/paste.
 * - Allows safe tuning for CI vs. local without hunting through specs.
 *
 * Usage:
 * - import { wait } from '@test/e2e/helpers/waitTimeouts'
 * - await expect(locator).toBeVisible({ timeout: wait.defaultWait })
 */

/**
 * Tiny UI acknowledgement waits (e.g., cookie banners, quick toggles).
 *
 * Increase this if CI is consistently slower to show/hide small UI.
 */
const tinyUi = 1_000

/**
 * Quick assertion waits where the UI should update almost immediately.
 *
 * Use for short "event → DOM update" flows where we don't want to mask slowness.
 */
const quickAssert = 2_000

/**
 * Short operations that may require a small async hop (e.g., network-less client work).
 */
const shortOperation = 3_000

/**
 * Default wait for typical selectors / expectations in E2E.
 *
 * This is intentionally conservative: long enough for real navigation + hydration jitter,
 * short enough to fail fast when selectors are broken.
 */
const defaultWait = 5_000

/**
 * Polling timeout for state that should converge quickly, but may involve transitions.
 */
const polling = 8_000

/**
 * Navigation / view-transition ready waits (page loads, header islands, menus).
 *
 * Increase this if you see intermittent failures around navigation and hydration.
 */
const navigation = 15_000

/**
 * Heavier navigation readiness (e.g., a full reload + header readiness).
 */
const heavyNavigation = 20_000

/**
 * Long navigation timeout for pages that are known to be slower in CI.
 */
const slowNavigation = 25_000

/**
 * Bespoke: cache-bust navigation can be especially slow in CI because it defeats caching.
 *
 * Keep this value high but scoped to that test only.
 */
const bespokeCacheBustNavigation = 35_000

/**
 * Bespoke: mobile menu animation duration + buffer.
 *
 * Prefer event-driven waits where possible, but this is used to avoid flakiness
 * around a known CSS animation duration.
 */
const bespokeMobileMenuAnimationBuffer = 600

/**
 * Bespoke: the mobile nav "About" link can take longer to become visible on some runs.
 *
 * This is intentionally separate from the default wait so it stands out in reviews.
 */
const bespokeMobileAboutLinkVisible = 10_000

export const wait = {
  tinyUi,
  quickAssert,
  shortOperation,
  defaultWait,
  polling,
  navigation,
  heavyNavigation,
  slowNavigation,
  bespokeCacheBustNavigation,
  bespokeMobileMenuAnimationBuffer,
  bespokeMobileAboutLinkVisible,
} as const
