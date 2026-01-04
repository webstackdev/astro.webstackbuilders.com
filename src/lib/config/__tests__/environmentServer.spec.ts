/**
 * Unit tests for cookie utilities
 * Tests the wrapper functions around js-cookie library
 */
import { describe, it, expect } from 'vitest'
import { isE2eTest, isProd, isTest, isUnitTest } from '@lib/config'

describe('Build-time environment handling utilities', () => {
  it('should always report running in Vitest in a unit test', () => {
    expect(isUnitTest()).toBeTruthy()
  })

  it('should report not running in Playwright in a unit test', () => {
    expect(isE2eTest()).toBeFalsy()
  })

  it('isTest() should return true when running in Vitest', () => {
    expect(isTest()).toBeTruthy()
  })

  // Can't test isDev() - result varies between local and GH Action runner

  it('isProd() should return false when running in Vitest', () => {
    expect(isProd()).toBeFalsy()
  })
})
