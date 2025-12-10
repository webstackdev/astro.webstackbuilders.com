import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@pages/api/social-card'

type CollectionFixture = Array<{
  id: string
  data: {
    title: string
    description?: string
  }
}>

const collections: {
  articles: CollectionFixture
  caseStudies: CollectionFixture
  services: CollectionFixture
  downloads: CollectionFixture
} = {
  articles: [],
  caseStudies: [],
  services: [],
  downloads: [],
}
const generateOpenGraphImageMock = vi.hoisted(() =>
  vi.fn(async () => Buffer.from('mock-image')),
)

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection: string) => {
    const key = collection as keyof typeof collections
    return collections[key] ?? []
  }),
}))

vi.mock('astro-og-canvas', () => ({
  generateOpenGraphImage: generateOpenGraphImageMock,
}))

const buildRequest = (url: string) =>
  GET({
    request: new Request(url),
    clientAddress: '127.0.0.1',
    cookies: { get: () => undefined },
  } as any)

const seedCollections = () => {
  collections.articles = [
    {
      id: 'sample-article',
      data: {
        title: 'Sample Article',
        description: 'Article Description',
      },
    },
  ]

  collections.caseStudies = [
    {
      id: 'case-study',
      data: {
        title: 'Case Study',
        description: 'Case study summary',
      },
    },
  ]

  collections.services = []
  collections.downloads = []
}

describe('Social Card API - GET /api/social-card', () => {
  beforeEach(() => {
    generateOpenGraphImageMock.mockReset()
    generateOpenGraphImageMock.mockResolvedValue(Buffer.from('mock-image'))
    seedCollections()
  })

  it('returns a PNG image for a known slug', async () => {
    const response = await buildRequest(
      'http://localhost/api/social-card?slug=articles/sample-article'
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(generateOpenGraphImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sample Article',
        description: 'Article Description',
      })
    )

    const buffer = Buffer.from(await response.arrayBuffer()).toString()
    expect(buffer).toBe('mock-image')
  })

  it('falls back to provided metadata when slug is unknown', async () => {
    const response = await buildRequest(
      'http://localhost/api/social-card?slug=unknown&page=1&title=Preview&description=Shared%20preview'
    )

    expect(response.status).toBe(200)
    expect(generateOpenGraphImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Preview',
        description: 'Shared preview',
      })
    )
  })

  it('returns an error response when generation fails', async () => {
    generateOpenGraphImageMock.mockRejectedValueOnce(new Error('boom'))

    const response = await buildRequest('http://localhost/api/social-card?slug=articles/foo')
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.message).toBe('Unable to generate social card')
  })
})
