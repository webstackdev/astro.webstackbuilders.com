import { defineCollection, reference, z } from 'astro:content'
import { glob, file } from 'astro/loaders'
import { validTags } from './content/_tagList'

const pattern = '**\/[^_]*.{md,mdx}'

// export type AboutSchema = z.infer<typeof aboutSchema>

/**
 * About
 */
const aboutSchema = z.object({
  id: z.string(),
  title: z.string(),
})

const aboutCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/about' }),
  schema: aboutSchema,
})

/**
 * Articles
 */
const articlesSchema = z.object({
  title: z.string(),
  description: z.string(),
  // Reference a single author from the `authors` collection by `id`
  author: reference('authors'),
  tags: z.array(z.enum(validTags)),
  image: z
    .object({
      src: z.string(),
      alt: z.string(),
    }),
  // In YAML, dates written without quotes around them are interpreted as Date objects
  publishDate: z.date(),
  isDraft: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
})

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
  })
})

const authorsCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/authors' }),
  schema: () => authorsSchema,
})

/**
 * Case Studies
 */
const caseStudiesSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.enum(validTags)),
  // In YAML, dates written without quotes around them are interpreted as Date objects
  publishDate: z.date(),
  isDraft: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  // Optional fields that may exist in some case studies
  image: z.string().optional(),
  client: z.string().optional(),
  author: reference('authors').optional(),
})

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
 * Cookie consent tracking
 *
 * This is the categories of cookies used on the website for the cookie consent
 * manager to use in informing users and offering opt-out:
 * - "essential-website-cookies" Cannot be opted out of and are necessary for
 *                               the site to function.
 * - "performance-and-functionality-cookies" Search widget, weather update, etc.
 * - "analytics-and-customization-cookies" Google Analytics, theme cookie
 */
const cookiesEntrySchema = z.object({
  name: z.string(),
  purpose: z.string(),
  provider: z.string().url(),
  service: z.string(),
  "service-privacy-policy-url": z.string().url(),
  country: z.string().includes('_').length(5),
  type: z.string(),
  "expires-in": z.string(),
})

const cookiesSchema = z.object({
  category: z.string(),
  cookies: z.array(cookiesEntrySchema),
})

const cookiesCollection = defineCollection({
  loader: file('./src/content/cookies.json'),
  schema: cookiesSchema,
})

/**
 * Services
 */
const servicesSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.enum(validTags)),
  // In YAML, dates written without quotes around them are interpreted as Date objects
  publishDate: z.date(),
  isDraft: z.boolean().default(false),
  category: z.string().optional(),
})

const servicesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/services' }),
  schema: () => servicesSchema,
})

/**
 * Site pages like privacy, cookies, 404, and offline
 */
const sitePagesSchema = z.object({
  title: z.string(),
  publishDate: z.date(),
  isDraft: z.boolean().default(false),
})

const sitePagesCollection = defineCollection({
  loader: glob({ pattern, base: './src/content/site' }),
  schema: () => sitePagesSchema,
})

/**
 * Storage
 *
 * Names for local and session storage keys that are referenced in both client script
 * and Astro templates, and that need to stay in sync.
 */
const storageSchema = z.object({
  key: z.string(),
  value: z.string(),
})

const storageCollection = defineCollection({
  loader: file('./src/content/storage.json'),
  schema: storageSchema,
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
    }),
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
 * - The `components/themePicker/initial.njk` to set the window.metaColors global variable that"s used to swap out the previous <meta> element when the theme is changed (`id` and `colors.backgroundOffset` properties only)
 */

/** @NOTE: These need to be kept in sync with `src/assets/scss/variables/_themes.scss` */
const themesSchema = z.object({
  id: z.enum(['default', 'dark']),
  name: z.enum(['Light', 'Dark']),
  colors: z.object({
    backgroundOffset: z.string(),
  })
})

const themesCollection = defineCollection({
  loader: file('./src/content/themes.json'),
  schema: themesSchema,
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
  cookies: cookiesCollection,
  services: servicesCollection,
  sitePages: sitePagesCollection,
  storage: storageCollection,
  testimonials: testimonialCollection,
  themes: themesCollection,
}
