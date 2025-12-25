import { describe, expect, it, vi } from 'vitest'

import upstashResponseFixture from '../__fixtures__/response.json'

describe('performSearch', () => {
  it('queries Upstash Search with expected config', async () => {
    vi.resetModules()

    const getOptionalEnv = vi.fn((key: string) => {
      if (key === 'PUBLIC_UPSTASH_SEARCH_REST_URL') {
        return 'https://example.upstash.io'
      }
      if (key === 'PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN') {
        return 'readonly-token'
      }
      return undefined
    })

    const searchFn = vi.fn(async () => upstashResponseFixture)
    const indexFn = vi.fn((indexName: string) => ({ search: searchFn, indexName }))
    const searchConstructor = vi.fn()

    class SearchMock {
      constructor(config: { url: string; token: string }) {
        searchConstructor(config)
      }

      index(indexName: string) {
        const { search } = indexFn(indexName)
        return { search }
      }
    }

    vi.doMock('@lib/config/environmentServer', () => ({
      getOptionalEnv,
    }))
    vi.doMock('@upstash/search', () => ({
      Search: SearchMock,
    }))

    const { performSearch } = await import('../domain')

    const response = await performSearch('typescript', 4)

    expect(getOptionalEnv).toHaveBeenCalledWith('PUBLIC_UPSTASH_SEARCH_REST_URL')
    expect(getOptionalEnv).toHaveBeenCalledWith('PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN')
    expect(searchConstructor).toHaveBeenCalledWith({ url: 'https://example.upstash.io', token: 'readonly-token' })
    expect(indexFn).toHaveBeenCalledWith('default')
    expect(searchFn).toHaveBeenCalledWith({ query: 'typescript', limit: 4 })
    expect(response).toEqual(upstashResponseFixture)
  })

  it('throws when Search is not configured', async () => {
    vi.resetModules()

    vi.doMock('@lib/config/environmentServer', () => ({
      getOptionalEnv: vi.fn(() => undefined),
    }))
    vi.doMock('@upstash/search', () => ({
      Search: vi.fn(),
    }))

    const { performSearch } = await import('../domain')

    await expect(performSearch('hello', 2)).rejects.toThrow('Search is not configured.')
  })
})
