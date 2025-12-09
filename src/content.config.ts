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
import { defineCollection, reference, z, type SchemaContext } from 'astro:content'
import { glob, file } from 'astro/loaders'
import { validTags } from '@content/_tagList'
/**
 * Wraps a collection schema with a refinement that enforces breadcrumb title length limits */
import { withBreadcrumbTitleWarning } from '@lib/helpers/breadcrumbTitleLengthRefinement'

/**
 * NOTE: In YAML, dates written without quotes around them are interpreted as Date objects */

/** Only load markdown and MDX files that do not start with an underscore */
const pattern = '**\/[^_]*.{md,mdx}'

const createBaseCollectionSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string(),
    cover: z
      .object({
        src: image(),
        alt: z.string(),
      }),
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
const articlesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/articles' }),
  schema: context =>
    withBreadcrumbTitleWarning(
      createBaseCollectionSchema(context).extend({
        author: reference('authors'),
        readingTime: z.string().optional(),
        showToc: z.boolean().default(true),
      }),
      'articles'
    ),
})

/**
 * Case Studies
 */
const caseStudiesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/case-studies' }),
  schema: context =>
    withBreadcrumbTitleWarning(
      createBaseCollectionSchema(context).extend({
        client: z.string().optional(),
        duration: z.string().optional(),
        industry: z.string().optional(),
        projectType: z.string().optional(),
        showToc: z.boolean().default(false),
      }),
      'caseStudies'
    ),
})

/**
 * Services
 */
const servicesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/services' }),
  schema: context =>
    withBreadcrumbTitleWarning(
      createBaseCollectionSchema(context).extend({
        category: z.string().optional(),
        deliverables: z.array(z.string()).optional(),
        duration: z.string().optional(),
        pricing: z.string().optional(),
        showToc: z.boolean().default(false),
      }),
      'services'
    ),
})

/**
 * Downloads
 */
const downloadsCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/downloads' }),
  schema: context =>
    withBreadcrumbTitleWarning(
      createBaseCollectionSchema(context).extend({
        author: reference('authors').optional(),
        fileName: z.string(),
        fileSize: z.string().optional(),
        fileType: z.enum(['PDF', 'eBook', 'Whitepaper', 'Guide', 'Report', 'Template']),
        pages: z.number().optional(),
        readingTime: z.string().optional(),
        showToc: z.boolean().default(false),
      }),
      'downloads'
    ),
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
const aboutCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/about' }),
  schema: withBreadcrumbTitleWarning(
    z.object({
      id: z.string(),
      title: z.string(),
    }),
    'about'
  ),
})

/**
 * Authors
 */
const authorsCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/authors' }),
  schema: () => z.object({
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
  }),
})

/**
 * Contact data
 */
const contactDataCollection = defineCollection({
  loader: file('./src/content/contact.json'),
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
    address: z.string(),
    city: z.string(),
    state: z.string().length(2),
    index: z.string(),
    telephoneLocal: z.string(),
    telephoneMobile: z.string(),
    telephoneTollFree: z.string(),
    social: z.array(
      z.object({
        network: z.string(),
        name: z.string(),
        url: z.string().url(),
        order: z.number(),
      }),
    ),
  }),
})

/**
 * Testimonials. These do not have pages generated for them.
 */
const testimonialCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/testimonials' }),
  schema: () => z.object({
    name: z.string(),
    organization: z.string().optional(),
    tags: z.array(z.enum(validTags)),
    avatar: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    publishDate: z.date(),
    active: z.boolean().default(false),
    isDraft: z.boolean().default(false),
  }),
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
