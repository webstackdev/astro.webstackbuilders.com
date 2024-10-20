/**
 * Tests for type guards for primitives
 */
import { describe, expect, test } from '@jest/globals'
import { isString } from '../primitives'

describe('isString assertion', () => {
  test('Valid string returns true from assertion', () => {
    const sut = isString(`test string`)
    expect(sut).toBeTruthy()
  })

  test('Number returns false from assertion', () => {
    const sut = isString(14)
    expect(sut).toBeFalsy()
  })
})
