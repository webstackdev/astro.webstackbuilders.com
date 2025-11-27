import { describe, expect, test } from 'vitest'
import { mastodonConfig, buildShareUrl } from '@components/Social/Mastodon/client/config'

describe('mastodonConfig', () => {
  test('uses share endpoint with text param', () => {
    expect(mastodonConfig.endpoint).toBe('share')
    expect(mastodonConfig.params.text).toBe('text')
  })
})

describe('buildShareUrl', () => {
  test('builds share URL for plain domain', () => {
    const url = buildShareUrl('mastodon.social', 'Hello World')
    expect(url).toBe('https://mastodon.social/share?text=Hello+World')
  })

  test('strips protocol and trailing slash', () => {
    const url = buildShareUrl('https://mastodon.social/', 'Test')
    expect(url).toBe('https://mastodon.social/share?text=Test')
  })

  test('supports custom ports and unicode', () => {
    const url = buildShareUrl('mastodon.local:3000', 'Hello 世界')
    expect(url).toBe('https://mastodon.local:3000/share?text=Hello+%E4%B8%96%E7%95%8C')
  })
})
