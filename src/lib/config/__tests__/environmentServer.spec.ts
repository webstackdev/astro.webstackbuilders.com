/**
 * Unit tests for cookie utilities
 * Tests the wrapper functions around js-cookie library
 */
import { describe, it, expect } from 'vitest'
import { isDev, isE2eTest, isProd, isTest, isUnitTest } from '@lib/config'

describe('Build-time environment handling utilities', () => {
  it('should always report running in Vitest in a unit test', () => {
    expect(isUnitTest()).toBeTruthy()
  })

  it('should report not running in Playwright in a unit test', () => {
    expect(isE2eTest()).toBeFalsy()
  })

  it('should report isTest is true when running in Vitest', () => {
    expect(isTest()).toBeTruthy()
  })

  it('should report running in development environment when running in Vitest', () => {
    expect(isDev()).toBeTruthy()
  })

  it('should report not running in production environment when running in Vitest', () => {
    expect(isProd()).toBeFalsy()
  })
})
