// @vitest-environment happy-dom
/**
 * Tests for CookieConsent component using Container API pattern with happy-dom
 *
 * FIXME: These tests are currently disabled due to import.meta.env.DEV not being
 * available during SVG asset import collection phase. The Vite define config
 * doesn't apply early enough for Astro's asset processing. The CookieConsentComponent
 * import fails during collection because it imports an SVG asset.
 *
 * To re-enable these tests, we need to either:
 * 1. Mock the SVG import at a different level
 * 2. Configure Vite/Astro to properly handle import.meta.env during test collection
 * 3. Refactor the component to not import SVG assets at the module level
 */
import { describe, test } from 'vitest'

describe.skip('CookieConsent class works - DISABLED', () => {
  test('placeholder', () => {
    // All tests disabled - see FIXME above
  })
})
