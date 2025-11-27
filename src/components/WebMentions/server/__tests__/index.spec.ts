// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestError } from '@test/errors'
import type { Webmention, WebmentionResponse } from '@components/WebMentions/@types'
import fixture from '../__fixtures__/index.fixture.json'
import {
  fetchWebmentions,
  isOwnWebmention,
  webmentionsByUrl,
  webmentionCountByType,
} from '../index'

vi.mock('astro:env/client', () => ({
  WEBMENTION_IO_TOKEN: 'test-token',
}))

const fixtureResponse = fixture as WebmentionResponse

const createMockResponse = (
  overrides: Partial<Response> = {},
  payload: WebmentionResponse = fixtureResponse,
): Response => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => payload,
  ...overrides,
} as Response)

describe('fetchWebmentions', () => {
  const targetUrl = 'https://example.com/blog/post'
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches, filters, and sanitizes webmentions from the API', async () => {
    fetchMock.mockResolvedValue(createMockResponse())

    const results = await fetchWebmentions(targetUrl)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const firstCall = fetchMock.mock.calls.at(0)
    if (!firstCall) {
      throw new TestError('fetch was not called during webmention fetch test')
    }
    const [requestedUrl, init] = firstCall
    const parsedUrl = new URL(requestedUrl as string)

    expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://webmention.io/api/mentions.jf2')
    expect(parsedUrl.searchParams.get('target')).toBe(targetUrl)
    expect(parsedUrl.searchParams.get('token')).toBe('test-token')
    expect(parsedUrl.searchParams.get('per-page')).toBe('1000')
    expect(init).toEqual({ headers: { 'Cache-Control': 'max-age=300' } })

    expect(results).toHaveLength(3)
    const [firstResult, secondResult, thirdResult] = results
    if (!firstResult || !secondResult || !thirdResult) {
      throw new TestError('fixture must include at least three webmentions')
    }

    expect(firstResult['wm-property']).toBe('mention-of')
    expect(new Date(firstResult.published).getTime()).toBeLessThan(new Date(thirdResult.published).getTime())

    const sanitizedHtml = secondResult.content?.value ?? ''
    expect(sanitizedHtml).toBe('<p>Love this post</p>')
  })

  it('returns an empty array when the API responds with an error status', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockResolvedValue(
      createMockResponse({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) }),
    )

    const results = await fetchWebmentions(targetUrl)

    expect(results).toEqual([])
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('returns an empty array when the fetch call fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValue(new TestError('network down'))

    const results = await fetchWebmentions(targetUrl)

    expect(results).toEqual([])
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})

describe('Webmention helpers', () => {
  const helperWebmentions: Webmention[] = [
    {
      'wm-id': 'helper-1',
      'wm-target': 'https://example.com/a',
      'wm-property': 'mention-of',
      published: '2024-01-01T00:00:00.000Z',
      author: { name: 'Site Author', url: 'https://webstackbuilders.com/articles/launch' },
    },
    {
      'wm-id': 'helper-2',
      'wm-target': 'https://example.com/a',
      'wm-property': 'like-of',
      published: '2024-01-02T00:00:00.000Z',
      author: { name: 'Another User', url: 'https://social.example.com/users/2' },
    },
    {
      'wm-id': 'helper-3',
      'wm-target': 'https://example.com/b',
      'wm-property': 'mention-of',
      published: '2024-01-03T00:00:00.000Z',
      author: { name: 'Third User', url: 'https://elsewhere.example.com' },
    },
  ]

  it('detects when a webmention originates from the configured domain', () => {
    const [first, second, third] = helperWebmentions
    if (!first || !second || !third) {
      throw new TestError('helper webmentions fixture must include three entries')
    }

    expect(isOwnWebmention(first)).toBe(true)
    expect(isOwnWebmention(second)).toBe(false)
    expect(isOwnWebmention(third, ['https://elsewhere.example.com'])).toBe(true)
  })

  it('filters webmentions by target URL', () => {
    const filtered = webmentionsByUrl(helperWebmentions, 'https://example.com/a')

    expect(filtered).toHaveLength(2)
    expect(filtered.every((entry) => entry['wm-target'] === 'https://example.com/a')).toBe(true)
  })

  it('counts webmentions that match specific interaction types', () => {
    const count = webmentionCountByType(helperWebmentions, 'https://example.com/a', 'mention-of', 'like-of')

    expect(count).toBe(2)
  })
})
