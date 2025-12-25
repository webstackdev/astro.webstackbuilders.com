import { describe, expect, it, vi } from 'vitest'

import type { SearchHit } from '../@types'

type SearchActionInput = { q: string; limit?: number }
type SearchActionOutput = { hits: SearchHit[] }
type SearchActionConfig = {
  handler: (_input: SearchActionInput) => Promise<SearchActionOutput>
}

const getMockedHandler = (action: unknown): SearchActionConfig['handler'] => {
  return (action as SearchActionConfig).handler
}

vi.mock('astro:actions', () => {
  class ActionError extends Error {
    public code: string

    constructor({ code, message }: { code: string; message: string }) {
      super(message)
      this.code = code
      this.name = 'ActionError'
    }
  }

  return {
    ActionError,
    defineAction: (config: unknown) => config,
  }
})

describe('search.query.handler', () => {
  it('returns mapped hits', async () => {
    const mockHits: SearchHit[] = [{ title: 'Title', url: '/path', snippet: 'Snippet', score: 0.5 }]

    const performSearch = vi.fn(async () => [{ id: 'id-1', content: {}, metadata: {}, score: 1 }])
    const mapUpstashSearchResults = vi.fn(() => mockHits)

    vi.doMock('../domain', () => ({ performSearch }))
    vi.doMock('../responder', () => ({ mapUpstashSearchResults }))

    const { search } = await import('../action')

    // `defineAction` is mocked to return the config object.
    const response = await getMockedHandler(search.query)({ q: 'typescript' })

    expect(performSearch).toHaveBeenCalledWith('typescript', 8)
    expect(mapUpstashSearchResults).toHaveBeenCalledWith(
      [{ id: 'id-1', content: {}, metadata: {}, score: 1 }],
      'typescript',
    )
    expect(response).toEqual({ hits: mockHits })
  })

  it('passes through provided limit', async () => {
    vi.resetModules()

    const performSearch = vi.fn(async () => [])
    const mapUpstashSearchResults = vi.fn(() => [])

    vi.doMock('../domain', () => ({ performSearch }))
    vi.doMock('../responder', () => ({ mapUpstashSearchResults }))

    const { search } = await import('../action')

    await getMockedHandler(search.query)({ q: 'typescript', limit: 5 })

    expect(performSearch).toHaveBeenCalledWith('typescript', 5)
  })

  it('wraps thrown errors in ActionError', async () => {
    vi.resetModules()

    const performSearch = vi.fn(async () => {
      throw new Error('Upstash down')
    })
    const mapUpstashSearchResults = vi.fn(() => [])

    vi.doMock('../domain', () => ({ performSearch }))
    vi.doMock('../responder', () => ({ mapUpstashSearchResults }))

    const { search } = await import('../action')

    await expect(getMockedHandler(search.query)({ q: 'typescript' })).rejects.toMatchObject({
      name: 'ActionError',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Upstash down',
    })
  })
})
