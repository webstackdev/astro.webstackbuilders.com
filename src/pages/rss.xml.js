import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET(context) {
  const articles = await getCollection('articles')
  return rss({
    title: 'Astro Learner | Blog',
    description: 'My journey learning Astro',
    site: context.site,
    items: articles.map((article) => ({
      title: article.data.title,
      publishDate: article.data.pubDate,
      description: article.data.description,
      link: `/articles/${article.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  })
}