import { describe, expect, it } from 'vitest'

import { getSearchResultDisplayPath, highlightSearchText } from '../results'

describe('SearchBar result helpers', () => {
  it('extracts the relative path from an absolute url', () => {
    expect(
      getSearchResultDisplayPath(
        'https://www.webstackbuilders.com/articles/kubernetes-decision-framework#when-kubernetes-fits'
      )
    ).toBe('/articles/kubernetes-decision-framework#when-kubernetes-fits')
  })

  it('returns the same value for an existing relative url', () => {
    expect(getSearchResultDisplayPath('/deep-dive/introduction-to-vector-search')).toBe(
      '/deep-dive/introduction-to-vector-search'
    )
  })

  it('falls back to the search page when the url is not usable', () => {
    expect(getSearchResultDisplayPath('not a valid url')).toBe('/search')
  })

  it('wraps matching query terms in highlight markup', () => {
    const highlighted = highlightSearchText('Introduction to Vector Search', 'vector')

    expect(Array.isArray(highlighted)).toBe(true)

    const highlightedParts = highlighted as Array<
      string | { strings?: string[]; values?: unknown[] }
    >
    expect(
      highlightedParts.some(part => typeof part === 'string' && part.includes('Introduction to '))
    ).toBe(true)
    expect(highlightedParts.some(part => typeof part !== 'string')).toBe(true)
  })

  it('supports custom highlight classes so the live modal can match the scratchpad tokens', () => {
    const highlighted = highlightSearchText('Vector databases work.', 'vector', {
      highlightClassName: 'bg-warning-inverse text-content',
    })

    const highlightedParts = highlighted as Array<string | { values?: unknown[] }>
    const templatePart = highlightedParts.find(part => typeof part !== 'string') as
      | { values?: unknown[] }
      | undefined

    expect(templatePart?.values?.[0]).toBe('bg-warning-inverse text-content')
  })

  it('returns plain text when there is no highlightable query term', () => {
    expect(highlightSearchText('Introduction to Vector Search', 'v')).toBe(
      'Introduction to Vector Search'
    )
  })

  it('highlights terms containing regex metacharacters without using regex semantics', () => {
    const highlighted = highlightSearchText('C++ patterns for teams', 'c++')

    expect(Array.isArray(highlighted)).toBe(true)

    const highlightedParts = highlighted as Array<string | { values?: unknown[] }>
    expect(
      highlightedParts.some(
        part => typeof part === 'string' && part.includes(' patterns for teams')
      )
    ).toBe(true)
    expect(highlightedParts.some(part => typeof part !== 'string')).toBe(true)
  })
})
