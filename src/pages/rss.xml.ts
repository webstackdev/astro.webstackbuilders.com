import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET() {
  const now = new Date()
  const articles = await getCollection(
    'articles',
    ({ data }) => !data.isDraft && data.publishDate <= now
  )
  const sortedArticles = articles.sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  )

  return rss({
    title: 'Webstack Builders Website',
    description:
      'Webstack Builders is a solo software development agency specializing in platform engineering.',
    /**
     * This always runs in the context of astro build, which always occurs in
     * production mode so links always are generated with the production URL
     */
    site: 'https://www.webstackbuilders.com',
    trailingSlash: false,
    items: sortedArticles.map(article => ({
      title: article.data.title,
      pubDate: article.data.publishDate,
      description: article.data.description,
      link: `/articles/${article.id}`,
      categories: article.data.tags,
    })),
    customData: `<language>en-us</language>`,
  })
}
