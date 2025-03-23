/**
 * Unit tests for formatting filters
 */
const { describe, expect, test } = require('@jest/globals')
const { humanizeNumber, obfuscate, setExt } = require('../format')

describe(`formatting filter tests`, () => {
  test(`humanize number filter passes happy path`, async () => {
    expect(humanizeNumber(undefined, 1000)).toMatch(/1K/)
  })

  test(`obfuscate email address filter passes happy path`, async () => {
    expect(obfuscate(undefined, `mailto:someone@somewhere.test`)).toMatch(
      /&#109;&#97;&#105;&#108;&#116;&#111;&#58;&#115;&#111;&#109;&#101;&#111;&#110;&#101;&#64;&#115;&#111;&#109;&#101;&#119;&#104;&#101;&#114;&#101;&#46;&#116;&#101;&#115;&#116;/
    )
  })

  test(`set file name extension filter passes happy path`, async () => {
    expect(setExt(undefined, `image.jpeg`, `webp`)).toMatch(/image.webp/)
  })
})
