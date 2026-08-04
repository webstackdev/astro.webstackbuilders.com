import { describe, expect, it } from 'vitest'
import { BuildError } from '@lib/errors/BuildError'
import { contentPathHasAlternateVariant, parseContentPath } from '../index'

describe('parseContentPath', () => {
  it('parses an articles path into currentVariant and slug', () => {
    expect(parseContentPath('articles/my-article')).toEqual({
      currentVariant: 'articles',
      slug: 'my-article',
    })
  })

  it('parses a deep-dive path into currentVariant and slug', () => {
    expect(parseContentPath('deep-dive/web-vitals')).toEqual({
      currentVariant: 'deep-dive',
      slug: 'web-vitals',
    })
  })

  it('normalizes leading and trailing slashes', () => {
    expect(parseContentPath('/articles/my-article/')).toEqual({
      currentVariant: 'articles',
      slug: 'my-article',
    })
  })

  it('normalizes extra whitespace around path', () => {
    expect(parseContentPath('  /deep-dive/platform-reliability/  ')).toEqual({
      currentVariant: 'deep-dive',
      slug: 'platform-reliability',
    })
  })

  it('preserves nested slug segments', () => {
    expect(parseContentPath('articles/category/subcategory/my-article')).toEqual({
      currentVariant: 'articles',
      slug: 'category/subcategory/my-article',
    })
  })

  it('returns an empty slug when only the variant is provided', () => {
    expect(parseContentPath('articles')).toEqual({
      currentVariant: 'articles',
      slug: '',
    })
  })

  it('throws BuildError for unsupported variant', () => {
    expect(() => parseContentPath('services/my-service')).toThrow(BuildError)
    expect(() => parseContentPath('services/my-service')).toThrow(
      'Content/Switcher: invalid path variant.'
    )
  })

  it('throws BuildError for an empty path', () => {
    const parse = () => parseContentPath('   ')

    expect(parse).toThrow(BuildError)
    expect(parse).toThrow('Content/Switcher: invalid path variant.')
  })

  it('includes detailed context in the thrown BuildError', () => {
    try {
      parseContentPath('/unknown/thing')
      throw new Error('Expected parseContentPath to throw BuildError')
    } catch (error) {
      const typedError = error as BuildError

      expect(typedError).toBeInstanceOf(BuildError)
      expect(typedError.phase).toBe('compilation')
      expect(typedError.tool).toBe('content-switcher')
      expect(typedError.filePath).toBe('src/components/Content/Switcher/server/index.ts')
      expect(typedError.cause).toEqual({
        providedPath: '/unknown/thing',
        normalizedPath: 'unknown/thing',
        receivedVariant: 'unknown',
        expectedVariants: ['articles', 'deep-dive'],
      })
    }
  })
})

/**
 * These tests run against the real content collections (the same pattern used
 * by the CallToAction/Download tests). The slugs below are stable fixtures:
 * `reverse-engineering-documentation-legacy-systems` ships both an `index.mdx`
 * and a `pdf.mdx`, while
 * `kubernetes-pod-disruption-budget-autoscaler-node-rotation` has no `pdf.mdx`
 * and therefore no deep-dive route.
 */
describe('contentPathHasAlternateVariant', () => {
  it('returns true for an article that has a deep-dive entry', async () => {
    await expect(
      contentPathHasAlternateVariant('/articles/reverse-engineering-documentation-legacy-systems')
    ).resolves.toBe(true)
  })

  it('returns false for an article without a deep-dive entry', async () => {
    await expect(
      contentPathHasAlternateVariant(
        '/articles/kubernetes-pod-disruption-budget-autoscaler-node-rotation'
      )
    ).resolves.toBe(false)
  })

  it('returns true for a deep-dive path whose overview article exists', async () => {
    await expect(
      contentPathHasAlternateVariant('/deep-dive/reverse-engineering-documentation-legacy-systems')
    ).resolves.toBe(true)
  })

  it('returns false when the slug does not exist in either collection', async () => {
    await expect(contentPathHasAlternateVariant('/articles/no-such-article-slug')).resolves.toBe(
      false
    )
    await expect(contentPathHasAlternateVariant('/deep-dive/no-such-article-slug')).resolves.toBe(
      false
    )
  })

  it('returns false when the path has no slug', async () => {
    await expect(contentPathHasAlternateVariant('articles')).resolves.toBe(false)
    await expect(contentPathHasAlternateVariant('deep-dive')).resolves.toBe(false)
  })
})
