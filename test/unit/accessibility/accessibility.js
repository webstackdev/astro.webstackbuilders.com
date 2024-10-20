/**
 * Configuration for Axe accessibility library.
 *
 * Used in JavaScript eleventy/markdown tests:
 * @example const { axe } = require(`../../../test/jest/accessibility`)
 * In a test case:
 * @example expect(await axe(document.body)).toHaveNoViolations()
 */
const { configureAxe } = require(`jest-axe`)

exports.axe = configureAxe({
  impactLevels: ['minor'],
  rules: {
    /** Doesn't work with JSDOM */
    'color-contrast': { enabled: false },
    /** Skip check for content being contained by landmark region */
    region: { enabled: false },
  },
})
