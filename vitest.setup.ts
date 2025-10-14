/**
 * Vitest setup file for test environment configuration
 * This file runs before all test files
 */
import { expect } from 'vitest'
import { toHaveInProtoChain, toBeNil, toBeObject } from '@test/unit/matchers/assertions'

// Try to load axe matchers if available
try {
  // Use dynamic import to avoid TypeScript/linting issues
  import('vitest-axe/matchers').then((axeMatchers) => {
    expect.extend(axeMatchers)
  }).catch(() => {
    // Axe matchers not available, continue without them
  })
} catch {
  // Axe matchers not available, continue without them
}

// Extend vitest's expect with custom matchers
expect.extend({
  toHaveInProtoChain,
  toBeNil,
  toBeObject
})
