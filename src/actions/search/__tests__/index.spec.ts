import { describe, expect, it } from 'vitest'
import { mapUpstashSearchResults } from '@actions/search/search'

describe('mapUpstashSearchResults', () => {
  it('maps a results object with document fields', () => {
    const raw = {
      results: [
        {
          score: 0.9,
          document: {
            url: '/about',
            title: 'About',
            description: 'About page',
          },
        },
      ],
    }

    const hits = mapUpstashSearchResults(raw, 'about')

    expect(hits).toHaveLength(1)
    expect(hits[0]?.url).toBe('/about')
    expect(hits[0]?.title).toBe('About')
    expect(hits[0]?.snippet).toBe('About page')
  })

  it('falls back to search page when url missing', () => {
    const raw = {
      results: [
        {
          id: 'doc-1',
          score: 0.2,
          document: {
            title: 'Untitled',
          },
        },
      ],
    }

    const hits = mapUpstashSearchResults(raw, 'hello')

    expect(hits).toHaveLength(1)
    expect(hits[0]?.url).toBe('/search?q=hello')
    expect(hits[0]?.title).toBe('Untitled')
  })

  it('accepts an array response shape', () => {
    const raw = [
      {
        id: '/services',
        score: 0.7,
        document: {
          name: 'Services',
        },
      },
    ]

    const hits = mapUpstashSearchResults(raw, 'services')

    expect(hits).toHaveLength(1)
    expect(hits[0]?.url).toBe('/services')
    expect(hits[0]?.title).toBe('Services')
  })
})
