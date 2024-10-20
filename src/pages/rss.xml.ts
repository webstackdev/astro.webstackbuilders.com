import rss from "@astrojs/rss"
import { getCollection } from "astro:content"
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const articles = await getCollection('articles')
  return rss({
    title: 'Astro Learner | Blog',
    description: 'My journey learning Astro',
    site: context.site ?? 'https://webstackbuilders.com',
    items: articles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.publishDate,
      description: article.data.description,
      link: `/articles/${article.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  })
}
