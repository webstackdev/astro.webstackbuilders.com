import { defineCollection, reference, z } from 'astro:content'
import { glob, file } from 'astro/loaders'
import { validTags } from './tagList'

const articlesCollectionSchema = z.object({
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
})

export type ArticlesCollectionSchema = z.infer<typeof articlesCollectionSchema>

const articlesCollection = defineCollection({
  loader: glob({ pattern: '**\/[^_]*.{md,mdx}', base: './src/content/articles' }),
  schema: () => articlesCollectionSchema,
})

const authorsCollection = defineCollection({
  loader: file('src/data/authors.json'),
  schema: z.object({
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
  }),
});

/**
 * Visual themes used by the Theme Switcher component and script. These are used by:
 *
 * - The `components/themePicker/themes.njk` template that generates the theme card modal and items (`id` and `name` properties only)
 * - The `components/head/meta.njk` to set the <meta name="theme-color" content="CSS_COLOR" /> tag used for outside-the-page UI elements by the browser (`id` and `colors.backgroundOffset` properties only)
 * - The `components/themePicker/initial.njk` to set the window.metaColors global variable that"s used to swap out the previous <meta> element when the theme is changed (`id` and `colors.backgroundOffset` properties only)
 */

/** @NOTE: These need to be kept in sync with `src/assets/scss/variables/_themes.scss` */
const themesCollection = defineCollection({
  loader: file('src/data/themes.json'),
  schema: z.object({
    id: z.enum(['default', 'dark']),
    name: z.enum(['Light', 'Dark']),
    colors: z.object({
      backgroundOffset: z.string(),
    })
  }),
});

export const collections = {
  articles: articlesCollection,
  authors: authorsCollection,
  themes: themesCollection,
}
