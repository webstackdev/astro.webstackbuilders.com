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

  it('wraps serialization failures in a BuildError', () => {
    const stringifySpy = vi.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
      throw new TypeError('circular structure')
    })

    expect(() => getSchemas(createStructuredDataParams())).toThrow(BuildError)
    expect(stringifySpy).toHaveBeenCalled()
  })
})
