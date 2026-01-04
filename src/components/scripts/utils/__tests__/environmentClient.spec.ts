// @vitest-environment jsdom
/**
 * Unit tests for environment detection utilities
 * Tests the environment detection functions in a Vitest/jsdom context
 */
import { describe, it, expect } from 'vitest'
import { isUnitTest, isE2eTest, isTest, isProd } from '@lib/config/environmentServer'

describe('Environment detection utilities', () => {
  it('isUnitTest should return true when running in Vitest', () => {
    expect(isUnitTest()).toBe(true)
  })

  it('isE2eTest should return false in unit test context (no Playwright control)', () => {
    expect(isE2eTest()).toBe(false)
  })

  it('isTest() should return true when running in Vitest', () => {
    expect(isTest()).toBe(true)
  })

  // Can't test isDev() - result varies between local and GH Action runner

  it('isProd() should return false when running in Vitest', () => {
    expect(isProd()).toBe(false)
  })
})
