import type { AstroGlobal } from 'astro'
import type {
  Article,
  BreadcrumbList,
  ContactPage,
  ListItem,
  Organization,
  Service,
  WebSite,
  WithContext,
} from 'schema-dts'
import contactData from '@content/contact.json'
import { absoluteUrl } from '@components/scripts/utils/absoluteUrl'
import { BuildError } from '@lib/errors/BuildError'

const STRUCTURED_DATA_FILE = 'src/components/Head/server/structuredData.ts'
const LOGO_PATH = '/logo.png'
const ICON_PATH = '/icon-512.png'

type ContentType = 'article' | 'website'

export interface StructuredDataProps {
  path: string
  pageTitle: string
  description?: string
  contentType?: ContentType
  publishDate?: Date
  modifiedDate?: Date
  author?: string
  image?: string
}

export interface StructuredDataParams extends StructuredDataProps {
  astro: Pick<AstroGlobal, 'site' | 'url'>
}

export type StructuredDataThing = WithContext<
  | Organization
  | WebSite
  | Article
  | BreadcrumbList
  | Service
  | ContactPage
>

interface SchemaContext {
  path: string
  pageTitle: string
  description: string
  site: URL
  canonicalUrl: string
  pathSegments: string[]
  contentType?: ContentType
  publishDate?: Date
  modifiedDate?: Date
  author?: string
  image?: string
}

type SchemaBuilder = (_context: SchemaContext) => StructuredDataThing | null

export const getSchemas = (params: StructuredDataParams): string[] => {
  const context = createSchemaContext(params)
  const schemaObjects = schemaBuilders
    .map(builder => builder(context))
    .filter((schema): schema is StructuredDataThing => schema !== null)

  return schemaObjects.map((schema, index) => serializeSchema(schema, index, context.path))
}

const createSchemaContext = (params: StructuredDataParams): SchemaContext => {
  const { astro, path, pageTitle, description, contentType, publishDate, modifiedDate, author, image } = params

  if (!astro) {
    throw new BuildError('Astro context is required to generate structured data', {
      filePath: STRUCTURED_DATA_FILE,
    })
  }

  if (!(astro.site instanceof URL)) {
    throw new BuildError('Astro.site must be defined to generate structured data', {
      filePath: STRUCTURED_DATA_FILE,
    })
  }

  if (!path || typeof path !== 'string') {
    throw new BuildError('Structured data generation requires a valid path string', {
      filePath: STRUCTURED_DATA_FILE,
    })
  }

  if (!pageTitle || typeof pageTitle !== 'string') {
    throw new BuildError('Structured data generation requires a valid pageTitle', {
      filePath: STRUCTURED_DATA_FILE,
    })
  }

  const normalizedPath = normalizePath(path)
  const canonicalUrl = astro.url?.href ?? resolveRoute(normalizedPath, astro.site)
  const descriptionFallback = description ?? contactData.company.description
  const resolvedImage = resolveOptionalAssetUrl(image, astro.site)

  const context: SchemaContext = {
    path: normalizedPath,
    pageTitle,
    description: descriptionFallback,
    site: astro.site,
    canonicalUrl,
    pathSegments: normalizedPath.split('/').filter(Boolean),
  }

  if (contentType) {
    context.contentType = contentType
  }

  const validPublishDate = ensureValidDate(publishDate, 'publishDate')
  if (validPublishDate) {
    context.publishDate = validPublishDate
  }

  const validModifiedDate = ensureValidDate(modifiedDate, 'modifiedDate')
  if (validModifiedDate) {
    context.modifiedDate = validModifiedDate
  }

  if (author) {
    context.author = author
  }

  if (resolvedImage) {
    context.image = resolvedImage
  }

  return context
}

const organizationSchema: SchemaBuilder = context => {
  const logoUrl = resolveAssetUrl(LOGO_PATH, context.site)

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: contactData.company.name,
    url: contactData.company.url,
    logo: logoUrl,
    description: contactData.company.description,
    email: contactData.company.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: contactData.company.city,
      addressRegion: contactData.company.state,
      addressCountry: contactData.company.country,
    },
    sameAs: contactData.company.social.map(social => social.url),
  } satisfies WithContext<Organization>
}

const webSiteSchema: SchemaBuilder = context => {
  if (context.path !== '/') {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: contactData.company.name,
    url: contactData.company.url,
    description: context.description,
    publisher: {
      '@type': 'Organization',
      name: contactData.company.name,
      logo: resolveAssetUrl(ICON_PATH, context.site),
    },
  } satisfies WithContext<WebSite>
}

const articleSchema: SchemaBuilder = context => {
  if (context.contentType !== 'article' || !context.publishDate) {
    return null
  }

  const imageUrl = context.image

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: context.pageTitle,
    description: context.description,
    datePublished: context.publishDate.toISOString(),
    dateModified: (context.modifiedDate ?? context.publishDate).toISOString(),
    author: {
      '@type': 'Person',
      name: context.author || contactData.company.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: contactData.company.name,
      logo: resolveAssetUrl(ICON_PATH, context.site),
    },
    url: context.canonicalUrl,
    ...(imageUrl && { image: imageUrl }),
  } satisfies WithContext<Article>
}

const breadcrumbSchema: SchemaBuilder = context => {
  if (context.pathSegments.length < 2) {
    return null
  }

  const items: ListItem[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: resolveRoute('/', context.site),
    } satisfies ListItem,
    ...context.pathSegments.slice(0, -1).map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: formatSegmentName(segment),
      item: resolveRoute(`/${context.pathSegments.slice(0, index + 1).join('/')}`, context.site),
    }) satisfies ListItem),
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  } satisfies WithContext<BreadcrumbList>
}

const serviceSchema: SchemaBuilder = context => {
  if (!context.path.startsWith('/services/') || context.path === '/services/' || context.path === '/services') {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: context.pageTitle,
    description: context.description,
    provider: {
      '@type': 'Organization',
      name: contactData.company.name,
      url: contactData.company.url,
    },
    url: context.canonicalUrl,
  } satisfies WithContext<Service>
}

const contactPageSchema: SchemaBuilder = context => {
  if (context.path !== '/contact' && context.path !== '/contact/') {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: context.pageTitle,
    description: context.description,
    url: context.canonicalUrl,
    mainEntity: {
      '@type': 'Organization',
      name: contactData.company.name,
      email: contactData.company.email,
      url: contactData.company.url,
    },
  } satisfies WithContext<ContactPage>
}

const schemaBuilders: SchemaBuilder[] = [
  organizationSchema,
  webSiteSchema,
  articleSchema,
  breadcrumbSchema,
  serviceSchema,
  contactPageSchema,
]

const serializeSchema = (schema: StructuredDataThing, index: number, path: string): string => {
  try {
    return JSON.stringify(schema)
  } catch (error) {
    throw new BuildError(`Failed to serialize structured data schema at index ${index} for path ${path}`, {
      filePath: STRUCTURED_DATA_FILE,
      cause: error,
    })
  }
}

const normalizePath = (value: string): string => {
  if (!value.startsWith('/')) {
    return `/${value}`
  }
  return value === '' ? '/' : value
}

const ensureValidDate = (value?: Date, label?: string): Date | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) {
    throw new BuildError(`${label ?? 'Date'} must be a valid Date instance`, {
      filePath: STRUCTURED_DATA_FILE,
    })
  }

  return value
}

const resolveAssetUrl = (asset: string, site: URL): string => {
  try {
    return new URL(asset).href
  } catch {
    const normalizedRoute = asset.startsWith('/') ? asset : `/${asset}`
    return resolveRoute(normalizedRoute, site)
  }
}

const resolveOptionalAssetUrl = (asset: string | undefined, site: URL): string | undefined => {
  if (!asset) {
    return undefined
  }

  return resolveAssetUrl(asset, site)
}

const resolveRoute = (route: string, site: URL): string => {
  try {
    return absoluteUrl(route, site)
  } catch {
    throw new BuildError('Failed to resolve absolute URL for structured data generation', {
      filePath: STRUCTURED_DATA_FILE,
    })
  }
}

const formatSegmentName = (segment: string): string => {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}
