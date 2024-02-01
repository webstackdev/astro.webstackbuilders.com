
import { z, defineCollection } from 'astro:content'


const articlesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    publishDate: z.date(),
    isDraft: z.boolean().default(false),
  }),
})

export const collections = {
  articles: articlesCollection,
}
