/**
 * Unit tests for absoluteUrl helper
 */
import { describe, expect, test } from "vitest"
import { absoluteUrl } from "../absoluteUrl"

describe(`absoluteUrl helper`, () => {
  test(`returns fully qualified URL when given valid route and site`, () => {
    const site = new URL('https://example.com')
    const result = absoluteUrl('/about', site)
    expect(result).toBe('https://example.com/about')
  })

  test(`handles root path correctly`, () => {
    const site = new URL('https://example.com')
    const result = absoluteUrl('/', site)
    expect(result).toBe('https://example.com/')
  })

  test(`handles nested paths correctly`, () => {
    const site = new URL('https://example.com')
    const result = absoluteUrl('/blog/article-1', site)
    expect(result).toBe('https://example.com/blog/article-1')
  })

  test(`handles site with subdirectory`, () => {
    const site = new URL('https://example.com/subdir/')
    const result = absoluteUrl('/about', site)
    expect(result).toBe('https://example.com/about')
  })

  test(`handles query parameters`, () => {
    const site = new URL('https://example.com')
    const result = absoluteUrl('/search?q=test', site)
    expect(result).toBe('https://example.com/search?q=test')
  })

  test(`handles hash fragments`, () => {
    const site = new URL('https://example.com')
    const result = absoluteUrl('/page#section', site)
    expect(result).toBe('https://example.com/page#section')
  })

  test(`throws error when route is not provided`, () => {
    const site = new URL('https://example.com')
    expect(() => absoluteUrl('', site)).toThrow('absoluteUrl helper called but either route or site not passed')
  })

  test(`throws error when site is not a URL instance`, () => {
    expect(() => absoluteUrl('/about', undefined)).toThrow('absoluteUrl helper called but either route or site not passed')
  })

  test(`throws error when site is not a URL instance (string passed)`, () => {
    // @ts-expect-error Testing invalid input
    expect(() => absoluteUrl('/about', 'https://example.com')).toThrow('absoluteUrl helper called but either route or site not passed')
  })

  test(`normalizes relative paths`, () => {
    const site = new URL('https://example.com/base/')
    const result = absoluteUrl('about', site)
    expect(result).toBe('https://example.com/base/about')
  })

  test(`handles different protocols`, () => {
    const site = new URL('http://localhost:3000')
    const result = absoluteUrl('/test', site)
    expect(result).toBe('http://localhost:3000/test')
  })

  test(`preserves trailing slash in route`, () => {
    const site = new URL('https://example.com')
    const result = absoluteUrl('/about/', site)
    expect(result).toBe('https://example.com/about/')
  })
})
