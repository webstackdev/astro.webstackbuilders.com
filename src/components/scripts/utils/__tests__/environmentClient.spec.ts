// @vitest-environment happy-dom
/**
 * Unit tests for environment detection utilities
 * Tests the environment detection functions in a Vitest/happy-dom context
 */
import { describe, it, expect } from 'vitest'
import { isUnitTest, isE2eTest, isTest, isDev, isProd } from '@components/scripts/utils'

describe('Environment detection utilities', () => {
  it('isUnitTest should return true when running in Vitest', () => {
    expect(isUnitTest()).toBe(true)
  })

  it('isE2eTest should return false in unit test context (no Playwright control)', () => {
    expect(isE2eTest()).toBe(false)
  })

  it('isTest should return true when ran in unit test', () => {
    expect(isTest()).toBe(true)
  })

  it('isDev should return true when ran in unit test', () => {
    expect(isDev()).toBe(true)
  })

  it('isProd should return false when ran in unit test', () => {
    expect(isProd()).toBe(false)
  })
})
