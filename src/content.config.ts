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
import { validTags } from '@content/_tagList'
/**
 * Wraps a collection schema with a refinement that enforces breadcrumb title length limits */
import { withBreadcrumbTitleWarning } from '@lib/helpers/breadcrumbTitleLengthRefinement'

/**
 * NOTE: In YAML, dates written without quotes around them are interpreted as Date objects */

/** Only load markdown and MDX files that do not start with an underscore */
const pattern = '**\/[^_]*.{md,mdx}'

const baseCollectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z
    .object({
      src: z.string().default('cover.webp'),
      alt: z.string().default('Hero Image'),
    })
    .default({}),
  featured: z.boolean().default(false),
  isDraft: z.boolean().default(false),
  publishDate: z.date(),
  tags: z.array(z.enum(validTags)),
})

/**
 * =================================================================================
 *
 * Primary Content Collections
 *
 * =================================================================================
 */

/**
 * Articles
 */
const articlesSchema = withBreadcrumbTitleWarning(
  baseCollectionSchema.extend({
    author: reference('authors'),
    readingTime: z.string().optional(),
    showToc: z.boolean().default(true),
  }),
  'articles'
)

const articlesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/articles' }),
  schema: () => articlesSchema,
})

/**
 * Case Studies
 */
const caseStudiesSchema = withBreadcrumbTitleWarning(
  baseCollectionSchema.extend({
    client: z.string().optional(),
    duration: z.string().optional(),
    industry: z.string().optional(),
    projectType: z.string().optional(),
  }),
  'caseStudies'
)

const caseStudiesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/case-studies' }),
  schema: () => caseStudiesSchema,
})

/**
 * Services
 */
const servicesSchema = withBreadcrumbTitleWarning(
  baseCollectionSchema.extend({
    category: z.string().optional(),
    deliverables: z.array(z.string()).optional(),
    duration: z.string().optional(),
    pricing: z.string().optional(),
  }),
  'services'
)

const servicesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/services' }),
  schema: () => servicesSchema,
})

/**
 * Downloads
 */
const downloadsSchema = withBreadcrumbTitleWarning(
  baseCollectionSchema.extend({
    author: reference('authors').optional(),
    fileType: z.enum(['PDF', 'eBook', 'Whitepaper', 'Guide', 'Report', 'Template']),
    fileSize: z.string().optional(),
    pages: z.number().optional(),
    readingTime: z.string().optional(),
    fileName: z.string(),
  }),
  'downloads'
)

const downloadsCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/downloads' }),
  schema: () => downloadsSchema,
})

/**
 * =================================================================================
 *
 * Secondary Content Collections
 *
 * =================================================================================
 */

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
 * This comment is a placeholder to explain the src/content/themes.json used by the
 * Theme Switcher component and script to define visual themes. It is not used by the
 * content system, but there's also a lack of good logical places to add such a data file.
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
