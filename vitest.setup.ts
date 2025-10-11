/**
 * Vitest setup file for test environment configuration
 * This file runs before all test files
 */
import { expect } from 'vitest'
import * as axeMatchers from 'vitest-axe/matchers'

// Extend vitest's expect with accessibility matchers from vitest-axe
expect.extend(axeMatchers)
