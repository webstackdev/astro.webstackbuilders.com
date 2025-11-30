/**
 * Provides build-time validation and type generation for all content by Astro build system.
 * This file exports a collections object where each key is a collection name, and the value
 * uses defineCollection() to specify the schema for that collection. Astro uses this
 * configuration to automatically load and manage content from specified directories like
 * src/content/articles or src/content/testimonials.
 *
 * The 'email' collection is included in the src/content directory, but is not handled by
 * Astro's collections systems. It is used by files in src/pages/api.
 */
import { defineCollection, reference, z } from 'astro:content'
import { glob, file } from 'astro/loaders'
import { isProd } from '@lib/config/environmentServer'
import { validTags } from '@content/_tagList'

const pattern = '**\/[^_]*.{md,mdx}'

const MAX_BREADCRUMB_TITLE_LENGTH = 50
const loggedBreadcrumbTitleWarnings = new Set<string>()

const warnOnBreadcrumbTitleLength = (title: string, collectionName: string): void => {
  if (!isProd()) return
  if (title.length <= MAX_BREADCRUMB_TITLE_LENGTH) return

  const warningKey = `${collectionName}:${title}`
  if (loggedBreadcrumbTitleWarnings.has(warningKey)) return

  loggedBreadcrumbTitleWarnings.add(warningKey)
  console.warn(
    `[Breadcrumb Warning] ${collectionName} title "${title}" is ${title.length} characters long. Titles longer than ${MAX_BREADCRUMB_TITLE_LENGTH} characters will truncate in breadcrumbs.`
  )
}

const withBreadcrumbTitleWarning = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  collectionName: string
) =>
  schema.superRefine(data => {
    const candidateTitle = (data as { title?: string }).title
    if (typeof candidateTitle === 'string') {
      warnOnBreadcrumbTitleLength(candidateTitle, collectionName)
    }
  })

// export type AboutSchema = z.infer<typeof aboutSchema>

/**
 * About
 */
const aboutSchema = withBreadcrumbTitleWarning(
  z.object({
    id: z.string(),
    title: z.string(),
  }),
  'about'
)

const aboutCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/about' }),
  schema: aboutSchema,
})

/**
 * Articles
 */
const articlesSchema = withBreadcrumbTitleWarning(
  z.object({
    title: z.string(),
    description: z.string(),
    // Reference a single author from the `authors` collection by `id`
    author: reference('authors'),
    tags: z.array(z.enum(validTags)),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    // In YAML, dates written without quotes around them are interpreted as Date objects
    publishDate: z.date(),
    isDraft: z.boolean().default(false),
    featured: z.boolean().default(false),
    readingTime: z.string().optional(),
  }),
  'articles'
)

const articlesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/articles' }),
  schema: () => articlesSchema,
})

/**
 * Authors
 */
const authorsSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string(),
  social: z.object({
    twitter: z.object({
      name: z.string(),
      url: z.string().url(),
    }),
    github: z.object({
      name: z.string(),
      url: z.string().url(),
    }),
    linkedin: z.object({
      name: z.string(),
      url: z.string().url(),
    }),
  }),
})

const authorsCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/authors' }),
  schema: () => authorsSchema,
})

/**
 * Case Studies
 */
const caseStudiesSchema = withBreadcrumbTitleWarning(
  z.object({
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.enum(validTags)),
    // In YAML, dates written without quotes around them are interpreted as Date objects
    publishDate: z.date(),
    isDraft: z.boolean().default(false),
    featured: z.boolean().default(false),
    // Optional fields that may exist in some case studies
    image: z
      .union([
        z.string(),
        z.object({
          src: z.string(),
          alt: z.string(),
        }),
      ])
      .optional(),
    client: z.string().optional(),
    author: reference('authors').optional(),
    industry: z.string().optional(),
    projectType: z.string().optional(),
    duration: z.string().optional(),
  }),
  'caseStudies'
)

const caseStudiesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/case-studies' }),
  schema: () => caseStudiesSchema,
})

/**
 * Contact data
 */
const contactDataSocialItemSchema = z.object({
  network: z.string(),
  name: z.string(),
  url: z.string().url(),
  order: z.number(),
})

const contactDataSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: z.string(),
  city: z.string(),
  state: z.string().length(2),
  index: z.string(),
  telephoneLocal: z.string(),
  telephoneMobile: z.string(),
  telephoneTollFree: z.string(),
  social: z.array(contactDataSocialItemSchema),
})

const contactDataCollection = defineCollection({
  loader: file('./src/content/contact.json'),
  schema: contactDataSchema,
})

/**
 * Services
 */
const servicesSchema = withBreadcrumbTitleWarning(
  z.object({
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.enum(validTags)),
    // In YAML, dates written without quotes around them are interpreted as Date objects
    publishDate: z.date(),
    isDraft: z.boolean().default(false),
    category: z.string().optional(),
    icon: z.string().optional(),
    featured: z.boolean().default(false),
    pricing: z.string().optional(),
    duration: z.string().optional(),
    deliverables: z.array(z.string()).optional(),
  }),
  'services'
)

const servicesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/services' }),
  schema: () => servicesSchema,
})

/**
 * Testimonials. These do not have pages generated for them.
 */
const testimonialSchema = z.object({
  name: z.string(),
  organization: z.string().optional(),
  tags: z.array(z.enum(validTags)),
  avatar: z
    .object({
      src: z.string(),
      alt: z.string(),
    })
    .optional(),
  // In YAML, dates written without quotes around them are interpreted as Date objects
  publishDate: z.date(),
  active: z.boolean().default(false),
  isDraft: z.boolean().default(false),
})

const testimonialCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/testimonials' }),
  schema: () => testimonialSchema,
})

/**
 * Visual themes used by the Theme Switcher component and script. These are used by:
 *
 * - The `components/themePicker/themes.njk` template that generates the theme card modal and items (`id` and `name` properties only)
 * - The `components/head/meta.njk` to set the <meta name="theme-color" content="CSS_COLOR" /> tag used for outside-the-page UI elements by the browser (`id` and `colors.backgroundOffset` properties only)
 * - The `components/Head/client.ts` to set the window.metaColors global variable that iss used to swap out the previous <meta> element when the theme is changed (`id` and `colors.backgroundOffset` properties only)
 */

/**
 * Downloads
 */
const downloadsSchema = withBreadcrumbTitleWarning(
  z.object({
    title: z.string(),
    description: z.string(),
    author: reference('authors').optional(),
    tags: z.array(z.enum(validTags)),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    publishDate: z.date(),
    isDraft: z.boolean().default(false),
    featured: z.boolean().default(false),
    fileType: z.enum(['PDF', 'eBook', 'Whitepaper', 'Guide', 'Report', 'Template']),
    fileSize: z.string().optional(),
    pages: z.number().optional(),
    readingTime: z.string().optional(),
    fileName: z.string(), // Filename in public/downloads directory
  }),
  'downloads'
)

const downloadsCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/downloads' }),
  schema: () => downloadsSchema,
})

/**
 * Contact data
 */

export const collections = {
  about: aboutCollection,
  articles: articlesCollection,
  authors: authorsCollection,
  caseStudies: caseStudiesCollection,
  contactData: contactDataCollection,
  downloads: downloadsCollection,
  services: servicesCollection,
  testimonials: testimonialCollection,
}
