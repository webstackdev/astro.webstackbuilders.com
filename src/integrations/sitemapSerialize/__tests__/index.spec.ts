/**
 * Unit tests for sitemap serialization utilities
 */

import { describe, it, expect } from 'vitest'
import type { SitemapItem } from '@astrojs/sitemap'
import { EnumChangefreq } from 'sitemap'
import {
  createSerializeFunction,
  serializePagesData,
  transformPagesData,
} from '../index'

describe('createSerializeFunction', () => {
  const createSitemapItem = (url: string): SitemapItem => ({
    url,
    lastmod: '2025-01-01',
    changefreq: EnumChangefreq.WEEKLY,
    priority: 0.8,
    links: [],
  })

  describe('basic functionality', () => {
    it('should return item when no exclusions configured', () => {
      const serialize = createSerializeFunction()
      const item = createSitemapItem('https://example.com/about')

      const result = serialize(item)

      expect(result).toEqual(item)
    })

    it('should return item for non-excluded paths', () => {
      const serialize = createSerializeFunction({
        exclude: ['downloads', 'private'],
      })
      const item = createSitemapItem('https://example.com/about')

      const result = serialize(item)

      expect(result).toEqual(item)
    })
  })

  describe('exclusion logic', () => {
    it('should exclude top-level path without leading slash', () => {
      const serialize = createSerializeFunction({
        exclude: ['downloads'],
      })
      const item = createSitemapItem('https://example.com/downloads')

      const result = serialize(item)

      expect(result).toBeUndefined()
    })

    it('should exclude top-level path with leading slash', () => {
      const serialize = createSerializeFunction({
        exclude: ['/social-shares'],
      })
      const item = createSitemapItem('https://example.com/social-shares')

      const result = serialize(item)

      expect(result).toBeUndefined()
    })

    it('should exclude nested path', () => {
      const serialize = createSerializeFunction({
        exclude: ['/articles/demo'],
      })
      const item = createSitemapItem('https://example.com/articles/demo')

      const result = serialize(item)

      expect(result).toBeUndefined()
    })

    it('should exclude nested path without leading slash', () => {
      const serialize = createSerializeFunction({
        exclude: ['articles/demo'],
      })
      const item = createSitemapItem('https://example.com/articles/demo')

      const result = serialize(item)

      expect(result).toBeUndefined()
    })

    it('should not exclude similar but different paths', () => {
      const serialize = createSerializeFunction({
        exclude: ['download'],
      })
      const item = createSitemapItem('https://example.com/downloads')

      const result = serialize(item)

      expect(result).toEqual(item)
    })

    it('should exclude all sub-pages when top-level directory is excluded', () => {
      const serialize = createSerializeFunction({
        exclude: ['downloads'],
      })

      // Both the directory index and sub-pages should be excluded
      expect(serialize(createSitemapItem('https://example.com/downloads'))).toBeUndefined()
      expect(
        serialize(createSitemapItem('https://example.com/downloads/whitepaper'))
      ).toBeUndefined()
      expect(
        serialize(createSitemapItem('https://example.com/downloads/guide/chapter-1'))
      ).toBeUndefined()
    })

    it('should handle multiple exclusions', () => {
      const serialize = createSerializeFunction({
        exclude: ['downloads', 'social-shares', '/articles/demo'],
      })

      expect(serialize(createSitemapItem('https://example.com/downloads'))).toBeUndefined()
      expect(serialize(createSitemapItem('https://example.com/social-shares'))).toBeUndefined()
      expect(serialize(createSitemapItem('https://example.com/articles/demo'))).toBeUndefined()
      expect(serialize(createSitemapItem('https://example.com/about'))).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty exclude array', () => {
      const serialize = createSerializeFunction({ exclude: [] })
      const item = createSitemapItem('https://example.com/anything')

      const result = serialize(item)

      expect(result).toEqual(item)
    })

    it('should handle home page', () => {
      const serialize = createSerializeFunction({
        exclude: ['downloads'],
      })
      const item = createSitemapItem('https://example.com/')

      const result = serialize(item)

      expect(result).toEqual(item)
    })

    it('should handle deeply nested paths', () => {
      const serialize = createSerializeFunction({
        exclude: ['api/internal/secret'],
      })
      const item = createSitemapItem('https://example.com/api/internal/secret')

      const result = serialize(item)

      expect(result).toBeUndefined()
    })

    it('should preserve all sitemap item properties', () => {
      const serialize = createSerializeFunction()
      const item: SitemapItem = {
        url: 'https://example.com/about',
        lastmod: '2025-01-01',
        changefreq: EnumChangefreq.DAILY,
        priority: 0.9,
        links: [{ url: 'https://example.com/es/about', lang: 'es' }],
      }

      const result = serialize(item)

      expect(result).toEqual(item)
    })
  })
})

describe('transformPagesData', () => {
  it('should transform single-level pages to strings', () => {
    const data: Record<string, string[] | true> = {
      about: true,
      privacy: true,
      contact: true,
    }

    const result = transformPagesData(data)

    expect(result).toEqual(['about', 'privacy', 'contact'])
  })

  it('should transform multi-level pages to objects', () => {
    const data = {
      articles: ['first-post', 'second-post'],
      services: ['web-dev', 'consulting'],
    }

    const result = transformPagesData(data)

    expect(result).toEqual([
      { articles: ['first-post', 'second-post'] },
      { services: ['web-dev', 'consulting'] },
    ])
  })

  it('should handle mixed single and multi-level pages', () => {
    const data: Record<string, string[] | true> = {
      about: true,
      articles: ['first-post', 'second-post'],
      privacy: true,
      services: ['web-dev'],
    }

    const result = transformPagesData(data)

    expect(result).toEqual([
      'about',
      { articles: ['first-post', 'second-post'] },
      'privacy',
      { services: ['web-dev'] },
    ])
  })

  it('should handle empty data', () => {
    const data = {}

    const result = transformPagesData(data)

    expect(result).toEqual([])
  })

  it('should handle pages with empty arrays', () => {
    const data = {
      articles: [],
    }

    const result = transformPagesData(data)

    expect(result).toEqual([{ articles: [] }])
  })
})

describe('serializePagesData', () => {
  it('should create properly formatted JSON with single-level pages', () => {
    const data: Record<string, string[] | true> = {
      about: true,
      privacy: true,
    }

    const result = serializePagesData(data)
    const parsed = JSON.parse(result)

    expect(parsed).toEqual(['about', 'privacy'])
    expect(result).toMatchSnapshot()
  })

  it('should create properly formatted JSON with multi-level pages', () => {
    const data = {
      articles: ['typescript-guide', 'react-tutorial'],
      services: ['web-development', 'consulting'],
    }

    const result = serializePagesData(data)
    const parsed = JSON.parse(result)

    expect(parsed).toEqual([
      { articles: ['typescript-guide', 'react-tutorial'] },
      { services: ['web-development', 'consulting'] },
    ])
    expect(result).toMatchSnapshot()
  })

  it('should create properly formatted JSON with mixed page types', () => {
    const data: Record<string, string[] | true> = {
      about: true,
      articles: ['first-post', 'second-post', 'third-post'],
      privacy: true,
      'case-studies': ['client-a', 'client-b'],
      contact: true,
    }

    const result = serializePagesData(data)
    const parsed = JSON.parse(result)

    expect(parsed).toEqual([
      'about',
      { articles: ['first-post', 'second-post', 'third-post'] },
      'privacy',
      { 'case-studies': ['client-a', 'client-b'] },
      'contact',
    ])
    expect(result).toMatchSnapshot()
  })

  it('should format JSON with proper indentation', () => {
    const data = {
      articles: ['post-1'],
    }

    const result = serializePagesData(data)

    // Check that JSON is formatted with 2-space indentation
    expect(result).toContain('  ')
    expect(result).toContain('\n')
  })

  it('should handle empty data', () => {
    const data = {}

    const result = serializePagesData(data)
    const parsed = JSON.parse(result)

    expect(parsed).toEqual([])
    expect(result).toMatchSnapshot()
  })

  it('should create valid JSON for complex nested structure', () => {
    const data: Record<string, string[] | true> = {
      home: true,
      articles: ['intro-to-typescript', 'advanced-react', 'node-best-practices'],
      services: ['web-development', 'mobile-apps', 'consulting', 'training'],
      about: true,
      'case-studies': ['ecommerce-platform', 'saas-dashboard'],
      tags: ['javascript', 'typescript', 'react', 'node'],
    }

    const result = serializePagesData(data)

    // Verify it's valid JSON
    expect(() => JSON.parse(result)).not.toThrow()

    const parsed = JSON.parse(result)
    expect(parsed).toHaveLength(6)
    expect(result).toMatchSnapshot()
  })
})
