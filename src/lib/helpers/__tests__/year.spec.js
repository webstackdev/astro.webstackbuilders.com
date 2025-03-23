/**
 * Unit tests for shortcode that determines the canonical URL for a page
 */
const { afterEach, beforeEach, describe, expect, test } = require('@jest/globals')
const { year } = require('../year')

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
})

afterEach(() => {
  jest.useRealTimers()
})

describe(`Shortcode to get full year`, () => {
  test(`Returns numeric year`, () => {
    expect(year(undefined)).toBe(2020)
  })
})
