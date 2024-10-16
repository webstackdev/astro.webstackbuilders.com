import { describe, expect, test } from "vitest"
import { absoluteUrl } from "./absoluteUrl"

const url = new URL('https://www.example.com')

describe(`Gets the absolute URL`, () => {
  test(`Returns valid URL with absolute path`, () => {
    expect(absoluteUrl('/feed.xml', url)).toMatch(/https:\/\/www.example.com\/feed\.xml/)
  })

  test(`Returns valid URL with relative path`, () => {
    expect(absoluteUrl('feed.xml', url)).toMatch(/https:\/\/www.example.com\/feed\.xml/)
  })

  test(`Returns valid URL with directory path`, () => {
    expect(absoluteUrl('./feed.xml', url)).toMatch(
      /https:\/\/www.example.com\/feed\.xml/
    )
  })

  test(`Returns valid URL with default route param provided`, () => {
    expect(absoluteUrl('/', url)).toMatch(/https:\/\/www\.example\.com\//)
  })

  test(`Returns valid URL with fully qualified path`, () => {
    expect(absoluteUrl('https://example.org/feed.xml', url)).toMatch(
      /https:\/\/example.org\/feed\.xml/
    )
  })

  test(`Throws with no route param provided`, () => {
    expect(() => absoluteUrl('', url)).toThrowError()
  })
})
