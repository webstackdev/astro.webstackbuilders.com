import { describe, expect, it, vi } from 'vitest'

import upstashResponseFixture from '../__fixtures__/response.json'

describe('performSearch', () => {
  it('queries Upstash Search with expected config', async () => {
    vi.resetModules()

    const getUpstashUrl = vi.fn(() => 'https://example.upstash.io')
    const getUpstashPublicToken = vi.fn(() => 'readonly-token')

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

    vi.doMock('@actions/utils/environment/environmentActions', async () => {
      const actual = await vi.importActual<
        typeof import('@actions/utils/environment/environmentActions')
      >('@actions/utils/environment/environmentActions')

      return {
        ...actual,
        getUpstashUrl,
        getUpstashPublicToken,
      }
    })

    vi.doMock('@lib/config/environmentServer', () => ({
      isUnitTest: vi.fn(() => true),
      isTest: vi.fn(() => true),
      isDev: vi.fn(() => false),
      isProd: vi.fn(() => false),
    }))
    vi.doMock('@upstash/search', () => ({
      Search: SearchMock,
    }))

    const { performSearch } = await import('../domain')

    const response = await performSearch('typescript', 4)

    expect(getUpstashUrl).toHaveBeenCalledTimes(1)
    expect(getUpstashPublicToken).toHaveBeenCalledTimes(1)
    expect(searchConstructor).toHaveBeenCalledWith({
      url: 'https://example.upstash.io',
      token: 'readonly-token',
    })
    expect(indexFn).toHaveBeenCalledWith('default')
    expect(searchFn).toHaveBeenCalledWith({ query: 'typescript', limit: 4 })
    expect(response).toEqual(upstashResponseFixture)
  })

  it('throws when Search is not configured', async () => {
    vi.resetModules()

    const getUpstashUrl = vi.fn(() => {
      throw new Error('Search is not configured.')
    })
    const getUpstashPublicToken = vi.fn(() => 'readonly-token')

    vi.doMock('@actions/utils/environment/environmentActions', async () => {
      const actual = await vi.importActual<
        typeof import('@actions/utils/environment/environmentActions')
      >('@actions/utils/environment/environmentActions')

      return {
        ...actual,
        getUpstashUrl,
        getUpstashPublicToken,
      }
    })

    vi.doMock('@lib/config/environmentServer', () => ({
      isUnitTest: vi.fn(() => true),
      isTest: vi.fn(() => true),
      isDev: vi.fn(() => false),
      isProd: vi.fn(() => false),
    }))
    vi.doMock('@upstash/search', () => ({
      Search: vi.fn(),
    }))

    const { performSearch } = await import('../domain')

    await expect(performSearch('hello', 2)).rejects.toThrow('Search is not configured.')
    expect(getUpstashUrl).toHaveBeenCalledTimes(1)
    expect(getUpstashPublicToken).toHaveBeenCalledTimes(0)
  })
})
