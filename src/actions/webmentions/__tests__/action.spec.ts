import { beforeEach, describe, expect, it, vi } from 'vitest'

type MockedAction<Input, Output> = {
  handler: (input: Input) => Promise<Output>
}

const throwActionErrorMock = vi.fn()

vi.mock('astro:actions', () => ({
  defineAction: (config: unknown) => config,
}))

vi.mock('@actions/utils/errors', () => ({
  throwActionError: throwActionErrorMock,
}))

vi.mock('@components/WebMentions/server', () => ({
  fetchWebmentions: vi.fn(),
}))

describe('webmentions actions', () => {
  beforeEach(() => {
    throwActionErrorMock.mockReset()
    vi.resetModules()
  })

  it('returns normalized mention display data and interaction counts', async () => {
    const { fetchWebmentions } = await import('@components/WebMentions/server')
    const fetchWebmentionsMock = vi.mocked(fetchWebmentions)

    fetchWebmentionsMock.mockResolvedValue([
      {
        'wm-id': 'mention-1',
        'wm-target': 'https://example.com/post',
        'wm-source': 'https://elsewhere.example.com/1',
        'wm-property': 'mention-of',
        published: '2024-01-01T00:00:00.000Z',
        author: {
          name: 'Alice',
          photo: 'https://elsewhere.example.com/alice.jpg',
          url: 'https://elsewhere.example.com/alice',
        },
        content: {
          value: '<p>Nice post</p>',
        },
      },
      {
        'wm-id': 'like-1',
        'wm-target': 'https://example.com/post',
        'wm-source': 'https://elsewhere.example.com/2',
        'wm-property': 'like-of',
        published: '2024-01-02T00:00:00.000Z',
        author: {
          name: 'Bob',
          url: 'https://elsewhere.example.com/bob',
        },
      },
      {
        'wm-id': 'repost-1',
        'wm-target': 'https://example.com/post',
        'wm-source': 'https://elsewhere.example.com/3',
        'wm-property': 'repost-of',
        published: '2024-01-03T00:00:00.000Z',
        author: {
          name: 'Charlie',
          url: 'https://elsewhere.example.com/charlie',
        },
      },
    ])

    const { webmentions } = await import('../action')
    const listAction = webmentions.list as unknown as MockedAction<
      { url: string },
      {
        likesCount: number
        mentions: Array<{
          authorName: string
          authorUrl: string
          avatarUrl: string
          contentHtml: string
          id: string
          published: string
          sourceUrl: string
        }>
        repostsCount: number
      }
    >
    const result = await listAction.handler({ url: 'https://example.com/post' })

    expect(fetchWebmentionsMock).toHaveBeenCalledWith('https://example.com/post')
    expect(result.likesCount).toBe(1)
    expect(result.repostsCount).toBe(1)
    expect(result.mentions).toHaveLength(1)
    expect(result.mentions[0]).toMatchObject({
      authorName: 'Alice',
      authorUrl: 'https://elsewhere.example.com/alice',
      avatarUrl: 'https://elsewhere.example.com/alice.jpg',
      contentHtml: '<p>Nice post</p>',
      id: 'mention-1',
      published: '2024-01-01T00:00:00.000Z',
      sourceUrl: 'https://elsewhere.example.com/1',
    })
  })

  it('reports unexpected handler failures through the shared action error helper', async () => {
    const failure = new Error('Unexpected parse failure')
    const { fetchWebmentions } = await import('@components/WebMentions/server')
    vi.mocked(fetchWebmentions).mockRejectedValue(failure)
    throwActionErrorMock.mockImplementation(() => {
      throw failure
    })

    const { webmentions } = await import('../action')
    const listAction = webmentions.list as unknown as MockedAction<{ url: string }, unknown>

    await expect(listAction.handler({ url: 'https://example.com/post' })).rejects.toThrow(failure)
    expect(throwActionErrorMock).toHaveBeenCalledWith(
      failure,
      { route: '/_actions/webmentions/list', operation: 'list' },
      { fallbackMessage: 'Webmentions could not be loaded.' }
    )
  })
})