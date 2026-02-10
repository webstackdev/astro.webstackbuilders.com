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
/**
 * Wraps a collection schema with a refinement that enforces breadcrumb title length limits
 */
import { withBreadcrumbTitleWarning } from '@lib/helpers/breadcrumbTitleLengthRefinement'

/**
 * NOTE: In YAML, dates written without quotes around them are interpreted as Date objects
 */

const pattern = '**/index.mdx'
const flatMarkdownPattern = '**/*.mdx'

const createBaseCollectionSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string(),
    cover: image(),
    coverAlt: z.string(),
    featured: z.boolean().default(false),
    isDraft: z.boolean().default(false),
    publishDate: z.date(),
    modifiedDate: z.date().optional(),
  })

const createSocialCollectionSchema = () =>
  z.array(
    z.object({
      network: z.string(),
      name: z.string(),
      url: z.string().url(),
      order: z.number(),
    })
  )

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
        tags: reference('tags').array(),
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
        showToc: z.boolean().default(true),
      }),
      'caseStudies'
    ),
})

/**
 * Downloads
 */
const downloadsCollection = defineCollection({
  loader: glob({
    pattern: '**/download.mdx',
    base: './src/content/articles',
  }),
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
 * Test fixtures (used for Playwright E2E coverage)
 */
const testFixtureCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/test-fixtures' }),
  schema: context =>
    withBreadcrumbTitleWarning(
      createBaseCollectionSchema(context).extend({
        showToc: z.boolean().default(false),
      }),
      'testFixtureCollection'
    ),
})

/**
 * =================================================================================
 *
 * Stand-Alone Content Collections
 *
 * =================================================================================
 */

/**
 * Services
 */
const servicesCollection = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './src/content/services',
  }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      isDraft: z.boolean().default(false),
      order: z.number(),
    }),
})

/**
 * =================================================================================
 *
 * Secondary Content Collections
 *
 * =================================================================================
 */

/**
 * Authors
 */
const authorsCollection = defineCollection({
  loader: glob({ pattern: flatMarkdownPattern, base: './src/content/authors' }),
  schema: () =>
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      avatar: z.string(),
      social: createSocialCollectionSchema(),
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
    social: createSocialCollectionSchema(),
  }),
})

/**
 * Tags
 */
const tagsCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/tags' }),
  schema: ({ image }) =>
    z.object({
      slug: z.string(),
      displayName: z.string(),
      description: z.string(),
      cover: image(),
      coverAlt: z.string(),
      featured: z.boolean().default(false),
      logo: image().optional(),
      isSkill: z.boolean().default(false),
    }),
})

/**
 * Testimonials. These do not have pages generated for them.
 */
const testimonialCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/testimonials' }),
  schema: () =>
    z.object({
      name: z.string(),
      organization: z.string().optional(),
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
  articles: articlesCollection,
  authors: authorsCollection,
  caseStudies: caseStudiesCollection,
  contactData: contactDataCollection,
  downloads: downloadsCollection,
  services: servicesCollection,
  tags: tagsCollection,
  testFixtureCollection,
  testimonials: testimonialCollection,
}
