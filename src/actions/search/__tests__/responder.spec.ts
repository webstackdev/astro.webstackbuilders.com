import { describe, expect, it } from 'vitest'

import upstashResponseFixture from '../__fixtures__/response.json'
import { mapUpstashSearchResults } from '../responder'

describe('mapUpstashSearchResults', () => {
  it('maps an array response shape', () => {
    const hits = mapUpstashSearchResults(upstashResponseFixture, 'typescript')

    expect(hits).toHaveLength(upstashResponseFixture.length)
    expect(hits[0]).toMatchObject({
      title: 'TypeScript Best Practices for Modern Development',
      url: 'https://www.webstackbuilders.com/articles/typescript-best-practices',
      score: 1,
    })
    expect(hits[0]?.snippet).toEqual(expect.any(String))
    expect(hits[0]?.snippet?.length).toBeGreaterThan(0)
  })

  it('accepts a { results } wrapper shape', () => {
    const hits = mapUpstashSearchResults({ results: upstashResponseFixture }, 'typescript')
    expect(hits).toHaveLength(upstashResponseFixture.length)
  })

  it('returns empty when raw is not usable', () => {
    expect(mapUpstashSearchResults(null, 'q')).toEqual([])
    expect(mapUpstashSearchResults({ results: 'nope' }, 'q')).toEqual([])
  })

  it('falls back to a search URL when URL is invalid', () => {
    const raw = [
      {
        id: 'doc-1',
        score: 0.2,
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
})
