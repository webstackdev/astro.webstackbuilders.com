import { describe, expect, test } from 'vitest'
import { buildOfflineRedirectUrl } from '../url'

describe('buildOfflineRedirectUrl', () => {
  test('builds offline redirect URL with encoded returnTo parameter', () => {
    const result = buildOfflineRedirectUrl('https://example.com/articles/demo?tab=overview')

    expect(result).toBe('/offline?returnTo=https%3A%2F%2Fexample.com%2Farticles%2Fdemo%3Ftab%3Doverview')
  })

  test('encodes hash fragments and spaces', () => {
    const result = buildOfflineRedirectUrl('https://example.com/docs/my page#section 1')

    expect(result).toBe('/offline?returnTo=https%3A%2F%2Fexample.com%2Fdocs%2Fmy%20page%23section%201')
  })
})
