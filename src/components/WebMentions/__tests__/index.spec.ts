import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

const createMentions = () => [
  {
    'wm-id': 'mention-1',
    'wm-target': 'https://example.com/post',
    'wm-source': 'https://elsewhere.example.com/1',
    'wm-property': 'mention-of',
    published: '2024-01-01T00:00:00.000Z',
    author: {
      name: 'Alice',
      url: 'https://elsewhere.example.com/alice',
    },
    content: {
      value: '<p>Nice post</p>',
    },
  },
  {
    'wm-id': 'mention-2',
    'wm-target': 'https://example.com/post',
    'wm-source': 'https://elsewhere.example.com/1b',
    'wm-property': 'in-reply-to',
    published: '2024-01-01T01:00:00.000Z',
    author: {
      name: 'Dana',
      url: 'https://elsewhere.example.com/dana',
    },
    content: {
      value: '<p>Replying here</p>',
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
]

describe('WebMentions (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    vi.resetModules()
    container = await AstroContainer.create()
  })

  test('labels the section and interaction counts, and hides facepile avatars from AT', async () => {
    vi.doMock('@components/WebMentions/server', () => ({
      fetchWebmentions: vi.fn().mockResolvedValue(createMentions()),
    }))

    const WebMentions = (await import('@components/WebMentions/index.astro')).default

    const renderedHtml = await container.renderToString(WebMentions, {
      props: {
        url: 'https://example.com/post',
        showFacepile: true,
        facepileLimit: 1,
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const section = window.document.querySelector('#webmentions')
      expect(section?.getAttribute('aria-labelledby')).toBe('webmentions-heading')

      const likes = window.document.querySelector('span[aria-label="1 like"]')
      expect(likes).toBeTruthy()
      expect(likes?.querySelector('svg')?.getAttribute('focusable')).toBe('false')

      const reposts = window.document.querySelector('span[aria-label="1 repost"]')
      expect(reposts).toBeTruthy()
      expect(reposts?.querySelector('svg')?.getAttribute('focusable')).toBe('false')

      const facepile = window.document.querySelector('[aria-label^="Recent mentions:"]')
      expect(facepile?.getAttribute('role')).toBe('group')

      const facepileAvatars = facepile?.querySelectorAll('img[aria-hidden="true"]')
      expect(facepileAvatars?.length).toBeGreaterThan(0)

      const more = facepile?.querySelector('[aria-label="1 more mention"]')
      expect(more).toBeTruthy()
    })
  })
})
