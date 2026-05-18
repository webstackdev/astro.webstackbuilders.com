import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSchemas } from '../structuredData'
import { createStructuredDataParams } from '../__fixtures__/structuredData.fixture'
import { BuildError } from '@lib/errors/BuildError'

describe('getSchemas', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns serialized JSON-LD strings for the current page context', () => {
    const schemas = getSchemas(createStructuredDataParams())

    expect(schemas).toHaveLength(2)

    const parsed = schemas.map(schema => JSON.parse(schema))
    expect(parsed[0]['@type']).toBe('Organization')
    expect(parsed[1]['@type']).toBe('WebSite')
  })

  it('falls back to the request origin when Astro.site is unavailable', () => {
    const schemas = getSchemas(
      createStructuredDataParams({
        astro: {
          site: undefined,
          url: new URL('https://www.webstackbuilders.com/contact'),
        },
        path: '/contact',
      })
    )

    const parsed = schemas.map(schema => JSON.parse(schema))
    const contactPage = parsed.find(schema => schema['@type'] === 'ContactPage')

    expect(contactPage?.url).toBe('https://www.webstackbuilders.com/contact')
  })

  it('uses canonicalPath for article schema urls while keeping breadcrumbs on the rendered path', () => {
    const schemas = getSchemas(
      createStructuredDataParams({
        path: '/articles/example-article',
        canonicalPath: '/deep-dive/example-article',
        contentType: 'article',
        publishDate: new Date('2026-01-01T00:00:00.000Z'),
      })
    )

    const parsed = schemas.map(schema => JSON.parse(schema))
    const article = parsed.find(schema => schema['@type'] === 'Article')
    const breadcrumbs = parsed.find(schema => schema['@type'] === 'BreadcrumbList')

    expect(article?.url).toBe('https://www.webstackbuilders.com/deep-dive/example-article')
    expect(breadcrumbs?.itemListElement?.[1]?.item).toBe(
      'https://www.webstackbuilders.com/articles'
    )
  })

  it('wraps serialization failures in a BuildError', () => {
    const stringifySpy = vi.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
      throw new TypeError('circular structure')
    })

    expect(() => getSchemas(createStructuredDataParams())).toThrow(BuildError)
    expect(stringifySpy).toHaveBeenCalled()
  })
})
