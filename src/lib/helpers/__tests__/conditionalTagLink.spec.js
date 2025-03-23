/**
 * Unit tests for page title shortcode
 */
const { describe, expect, test } = require('@jest/globals')
const { conditionalTagLink } = require('../conditionalTagLink')

const collectionsFixtureEmpty = [
  {
    data: {
      tags: [],
    },
  },
]

const collectionsFixture = [
  {
    data: {
      tags: ['cms'],
    },
  },
]

describe(`Shortcode for conditional tag link`, () => {
  test(`Doesn't wrap for tag not in collection`, () => {
    expect(conditionalTagLink(undefined, collectionsFixtureEmpty, `cms`)).toMatch(`CMS`)
  })

  test(`Wraps for tag in collection`, () => {
    expect(conditionalTagLink(undefined, collectionsFixture, `cms`)).toMatch(`<a href="/tags/cms/">CMS</a>`)
  })
})
