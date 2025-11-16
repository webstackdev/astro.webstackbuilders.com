/**
 * Unit tests for path and slug extraction utilities
 */

import { describe, it, expect } from 'vitest'
/* eslint-disable-next-line no-restricted-imports */
import { getContentTypeFromPath, getFirstComponent, extractSlugAndCollection } from '../pathUtils'

describe('getContentTypeFromPath', () => {
  it('should detect articles content type', () => {
    const result = getContentTypeFromPath('/src/pages/articles/my-article.astro')
    expect(result).toBe('articles')
  })

  it('should detect services content type', () => {
    const result = getContentTypeFromPath('/src/pages/services/web-development.astro')
    expect(result).toBe('services')
  })

  it('should detect case-studies content type', () => {
    const result = getContentTypeFromPath('/src/pages/case-studies/client-success.astro')
    expect(result).toBe('case-studies')
  })

  it('should return null for non-content pages', () => {
    const result = getContentTypeFromPath('/src/pages/about.astro')
    expect(result).toBeNull()
  })

  it('should return null for home page', () => {
    const result = getContentTypeFromPath('/src/pages/index.astro')
    expect(result).toBeNull()
  })
})

describe('getFirstComponent', () => {
  it('should return first component alphabetically', () => {
    const components = [
      { name: 'Newsletter', path: '/path', importPatterns: [] },
      { name: 'Contact', path: '/path', importPatterns: [] },
      { name: 'Download', path: '/path', importPatterns: [] },
    ]

    const result = getFirstComponent(components)

    expect(result).toBe('Contact')
  })

  it('should handle single component', () => {
    const components = [{ name: 'Featured', path: '/path', importPatterns: [] }]

    const result = getFirstComponent(components)

    expect(result).toBe('Featured')
  })

  it('should return empty string for empty array', () => {
    const result = getFirstComponent([])
    expect(result).toBe('')
  })

  it('should sort case-insensitively', () => {
    const components = [
      { name: 'newsletter', path: '/path', importPatterns: [] },
      { name: 'Contact', path: '/path', importPatterns: [] },
      { name: 'DOWNLOAD', path: '/path', importPatterns: [] },
    ]

    const result = getFirstComponent(components)

    expect(result).toBe('Contact')
  })
})

describe('extractSlugAndCollection', () => {
  it('should extract slug from static articles page', () => {
    const result = extractSlugAndCollection(
      '/src/pages/articles/typescript-best-practices.astro',
      'articles'
    )

    expect(result).toEqual({
      slug: 'typescript-best-practices',
      collectionName: 'articles',
      isDynamicRoute: false,
    })
  })

  it('should extract slug from static services page', () => {
    const result = extractSlugAndCollection('/src/pages/services/web-development.astro', 'services')

    expect(result).toEqual({
      slug: 'web-development',
      collectionName: 'services',
      isDynamicRoute: false,
    })
  })

  it('should handle index pages', () => {
    const result = extractSlugAndCollection('/src/pages/articles/index.astro', 'articles')

    expect(result).toEqual({
      slug: 'index',
      collectionName: 'articles',
      isDynamicRoute: false,
    })
  })

  it('should detect dynamic routes with [slug]', () => {
    const result = extractSlugAndCollection('/src/pages/articles/[slug].astro', 'articles')

    expect(result).toEqual({
      collectionName: 'articles',
      isDynamicRoute: true,
    })
  })

  it('should detect dynamic routes with [...slug]', () => {
    const result = extractSlugAndCollection('/src/pages/case-studies/[...slug].astro', 'case-studies')

    expect(result).toEqual({
      collectionName: 'case-studies',
      isDynamicRoute: true,
    })
  })

  it('should return empty object when contentType is null', () => {
    const result = extractSlugAndCollection('/src/pages/about.astro', null)

    expect(result).toEqual({})
  })

  it('should handle nested static routes', () => {
    const result = extractSlugAndCollection(
      '/src/pages/articles/category/my-article.astro',
      'articles'
    )

    expect(result).toEqual({
      slug: 'my-article',
      collectionName: 'articles',
      isDynamicRoute: false,
    })
  })

  it('should handle pages without file extension in path parts', () => {
    const result = extractSlugAndCollection('/src/pages/services/', 'services')

    expect(result).toEqual({
      collectionName: 'services',
      isDynamicRoute: false,
    })
  })
})
