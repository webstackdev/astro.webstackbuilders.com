import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { getSoftwareName, getUrlDomain, isMastodonInstance, normalizeURL } from '../detector'

const createFetchResponse = <T>(data: T) => ({
  json: vi.fn().mockResolvedValue(data),
}) as unknown as Response

describe('mastodon detector utilities', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const schemaRel = 'http://nodeinfo.diaspora.software/ns/schema/2.1'

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('normalizeURL enforces scheme and trailing slash', () => {
    expect(normalizeURL('mastodon.social')).toBe('https://mastodon.social/')
    expect(normalizeURL('http://example.com/path')).toBe('http://example.com/path/')
  })

  test('getUrlDomain normalizes plain hostnames', () => {
    expect(getUrlDomain('mastodon.social')).toBe('mastodon.social')
    expect(getUrlDomain('https://fediverse.example/foo')).toBe('fediverse.example')
  })

  test('getSoftwareName fetches nodeinfo list from well-known path', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createFetchResponse({
          links: [
            { rel: schemaRel, href: 'https://mastodon.social/nodeinfo/2.1' },
            { rel: 'other', href: 'https://mastodon.social/nodeinfo/1.0' },
          ],
        })
      )
      .mockResolvedValueOnce(
        createFetchResponse({
          software: { name: 'Mastodon', version: '4.2.0' },
        })
      )

    const software = await getSoftwareName('mastodon.social')

    expect(software).toBe('Mastodon')
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const firstCallUrl = fetchMock.mock.calls[0]?.[0] as URL
    expect(firstCallUrl.pathname).toBe('/.well-known/nodeinfo')
    expect(firstCallUrl.origin).toBe('https://mastodon.social')
  })

  test('getSoftwareName returns undefined when nodeinfo cannot be fetched', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValueOnce(new Error('network failure'))

    await expect(getSoftwareName('mastodon.social')).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('isMastodonInstance returns true for supported flavours', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createFetchResponse({
          links: [{ rel: schemaRel, href: 'https://example.social/nodeinfo' }],
        })
      )
      .mockResolvedValueOnce(
        createFetchResponse({
          software: { name: 'Hometown', version: '1.0' },
        })
      )

    await expect(isMastodonInstance('example.social')).resolves.toBe(true)
  })

  test('isMastodonInstance returns false when NodeInfo is missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    fetchMock.mockResolvedValueOnce(
      createFetchResponse({
        links: [],
      })
    )

    await expect(isMastodonInstance('pleroma.example')).resolves.toBe(false)
    expect(warnSpy).toHaveBeenCalledWith('No NodeInfo found for domain:', 'pleroma.example')
  })
})
