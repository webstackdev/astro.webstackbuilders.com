/**
 * Unit tests for normalizing tag names to Title Case
 */
const { describe, expect, test } = require('@jest/globals')
const { normalizeTagName } = require('../normalizeTagName')

describe(`Normalizes tag names to title case`, () => {
  test(`Non-exceptional camel case text properly normalized`, () => {
    expect(normalizeTagName(undefined, `adTech`)).toMatch(`Ad Tech`)
  })

  test(`Exceptional camel case text properly normalized`, () => {
    expect(normalizeTagName(undefined, `cms`)).toMatch(`CMS`)
  })
})
