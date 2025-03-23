/**
 * Configuration for Axe accessibility library.
 *
 * In a test case:
 * @example expect(await axe(document.body)).toHaveNoViolations()
 */
import { configureAxe } from "vitest-axe"

export const axe = () => configureAxe({
  rules: {
    /** Doesn't work with JSDOM */
    'color-contrast': { enabled: false },
    /** Skip check for content being contained by landmark region */
    region: { enabled: false },
  },
})
