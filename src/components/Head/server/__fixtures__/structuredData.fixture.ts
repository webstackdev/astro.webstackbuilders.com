import type { StructuredDataParams } from '../structuredData'

const DEFAULT_SITE_URL = 'https://www.webstackbuilders.com'

const normalizeFixturePath = (value: string): string => {
  if (value === '') {
    return '/'
  }

  return value.startsWith('/') ? value : `/${value}`
}

export const createStructuredDataParams = (
  overrides: Partial<StructuredDataParams> = {}
): StructuredDataParams => {
  const path = normalizeFixturePath(overrides.path ?? '/')
  const site = overrides.astro?.site ?? new URL(DEFAULT_SITE_URL)
  const url = overrides.astro?.url ?? new URL(path, site)

  const params: StructuredDataParams = {
    astro: overrides.astro ?? { site, url },
    path,
    pageTitle: overrides.pageTitle ?? 'Example Page Title',
  }

  if (overrides.description !== undefined) {
    params.description = overrides.description
  }
  if (overrides.contentType !== undefined) {
    params.contentType = overrides.contentType
  }
  if (overrides.publishDate !== undefined) {
    params.publishDate = overrides.publishDate
  }
  if (overrides.modifiedDate !== undefined) {
    params.modifiedDate = overrides.modifiedDate
  }
  if (overrides.author !== undefined) {
    params.author = overrides.author
  }
  return params
}
