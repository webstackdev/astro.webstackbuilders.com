import { describe, expect, it } from 'vitest'

import upstashResponseFixture from '../__fixtures__/response.json'
import { mapUpstashSearchResults } from '../responder'

describe('mapUpstashSearchResults', () => {
  it('maps an array response shape', () => {
    const hits = mapUpstashSearchResults(upstashResponseFixture, 'typescript')

    expect(hits).toHaveLength(2)
    expect(hits[0]).toMatchObject({
      title: 'TypeScript Best Practices for Modern Development',
      url: '/articles/typescript-best-practices',
      score: 1,
    })
    expect(hits[0]?.snippet).toEqual(expect.any(String))
    expect(hits[0]?.snippet?.length).toBeGreaterThan(0)
  })

  it('accepts a { results } wrapper shape', () => {
    const hits = mapUpstashSearchResults({ results: upstashResponseFixture }, 'typescript')
    expect(hits).toHaveLength(2)
  })

  it('returns empty when raw is not usable', () => {
    expect(mapUpstashSearchResults(null, 'q')).toEqual([])
    expect(mapUpstashSearchResults({ results: 'nope' }, 'q')).toEqual([])
  })

  it('falls back to a search URL when URL is invalid', () => {
    const raw = [
      {
        id: 'doc-1',
        score: 0.8,
        content: {
          url: 'javascript:alert(1)',
          title: 'Hello',
        },
        metadata: {},
      },
    ]

    const hits = mapUpstashSearchResults(raw, 'hello world')

    expect(hits).toHaveLength(1)
    expect(hits[0]?.url).toBe('/search?q=hello%20world')
    expect(hits[0]?.title).toBe('Hello')
  })

  it('filters out low relevancy results', () => {
    const raw = [
      {
        id: 'doc-1',
        score: 0.39,
        content: {
          url: '/articles/low-score',
          title: 'Low Score',
        },
        metadata: {},
      },
      {
        id: 'doc-2',
        score: 0.4,
        content: {
          url: '/articles/high-enough',
          title: 'High Enough',
        },
        metadata: {},
      },
    ]

    const hits = mapUpstashSearchResults(raw, 'hello world')

    expect(hits).toHaveLength(1)
    expect(hits[0]?.title).toBe('High Enough')
    expect(hits[0]?.score).toBe(0.4)
  })

  it('deduplicates hits that resolve to the same canonical path', () => {
    const raw = [
      {
        id: 'doc-1',
        score: 0.92,
        content: {
          url: 'https://www.webstackbuilders.com/services#good-fit-for',
          title: 'Good Fit For',
        },
        metadata: {},
      },
      {
        id: 'doc-2',
        score: 0.81,
        content: {
          url: 'https://www.webstackbuilders.com/services#what-you-get#good-fit-for',
          title: 'Good Fit For',
        },
        metadata: {},
      },
    ]

    const hits = mapUpstashSearchResults(raw, 'services')

    expect(hits).toHaveLength(1)
    expect(hits[0]?.url).toBe('https://www.webstackbuilders.com/services#good-fit-for')
    expect(hits[0]?.score).toBe(0.92)
  })
})
