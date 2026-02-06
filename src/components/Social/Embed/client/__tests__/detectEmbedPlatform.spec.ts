import { describe, expect, it } from 'vitest'
import { detectEmbedPlatform } from '@components/Social/Embed/client'

describe('detectEmbedPlatform', () => {
  it('detects platforms by hostname (not substring)', () => {
    expect(detectEmbedPlatform('https://twitter.com/user/status/123')).toBe('x')
    expect(detectEmbedPlatform('https://x.com/user/status/123')).toBe('x')
    expect(detectEmbedPlatform('https://www.linkedin.com/posts/something')).toBe('linkedin')
    expect(detectEmbedPlatform('https://bsky.app/profile/example/post/123')).toBe('bluesky')
    expect(detectEmbedPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube')
    expect(detectEmbedPlatform('https://gist.github.com/user/abcdef123456')).toBe('github-gist')
    expect(detectEmbedPlatform('https://codepen.io/user/pen/abc123')).toBe('codepen')
  })

  it('does not treat arbitrary URLs containing provider strings as trusted', () => {
    expect(detectEmbedPlatform('https://evil.example/?next=https://codepen.io/user/pen/abc')).toBe(
      'x'
    )
    expect(detectEmbedPlatform('https://codepen.io.evil.example/user/pen/abc')).toBe('x')
    expect(detectEmbedPlatform('https://evil.example/gist.github.com/user/abcdef')).toBe('x')
  })

  it('detects Mastodon by path shape across instances', () => {
    expect(detectEmbedPlatform('https://mastodon.social/@user/123456789')).toBe('mastodon')
    expect(detectEmbedPlatform('https://example.instance/users/user/statuses/123456789')).toBe(
      'mastodon'
    )
  })
})
