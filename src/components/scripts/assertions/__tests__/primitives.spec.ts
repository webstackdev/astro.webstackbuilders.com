import { describe, expect, it } from 'vitest'
import { isString } from '../primitives'

describe('primitive assertions', () => {
  it('returns true for primitive strings', () => {
    expect(isString('plain')).toBe(true)
  })

  it('returns true for String objects', () => {
    expect(isString(new String('wrapped'))).toBe(true)
  })

  it('rejects non-string values', () => {
    expect(isString(42)).toBe(false)
    expect(isString(undefined)).toBe(false)
    expect(isString({})).toBe(false)
  })
})
