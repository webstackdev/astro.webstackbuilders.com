/**
 * Unit tests for formatPhoneNumber utility
 */
import { describe, expect, test, vi } from 'vitest'
import { formatPhoneNumber } from '@components/Footer/server'
import { BuildError } from '@lib/errors/BuildError'

// Mock the logger
vi.mock('@lib/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}))

describe(`formatPhoneNumber helper`, () => {
  test(`returns formatted phone number for valid US number`, () => {
    const result = formatPhoneNumber('+12133734253')
    expect(result).toBe('(213) 373-4253')
  })

  test(`returns formatted phone number for valid US number with different area code`, () => {
    const result = formatPhoneNumber('+14155552671')
    expect(result).toBe('(415) 555-2671')
  })

  test(`returns formatted phone number for toll-free number`, () => {
    const result = formatPhoneNumber('+18005551234')
    expect(result).toBe('(800) 555-1234')
  })

  test(`throws BuildError for invalid phone number`, () => {
    expect(() => formatPhoneNumber('invalid')).toThrowError(BuildError)
  })

  test(`throws BuildError for empty string`, () => {
    expect(() => formatPhoneNumber('')).toThrowError(BuildError)
  })

  test(`throws BuildError for number without country code`, () => {
    expect(() => formatPhoneNumber('2133734253')).toThrowError(BuildError)
  })

  test(`handles phone number with extra characters`, () => {
    const result = formatPhoneNumber('+1 (213) 373-4253')
    expect(result).toBe('(213) 373-4253')
  })

  test(`returns formatted number for valid international number`, () => {
    const result = formatPhoneNumber('+442071838750')
    // UK numbers format differently, just verify it returns something
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })
})
