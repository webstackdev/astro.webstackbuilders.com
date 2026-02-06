import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

const toCategory = (tag: unknown) => {
  if (typeof tag === 'string') return tag
  if (tag && typeof tag === 'object' && 'id' in tag) {
    const id = (tag as { id?: unknown }).id
    if (typeof id === 'string') return id
  }
  return undefined
}

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
      categories: (article.data.tags ?? []).map(toCategory).filter((c): c is string => Boolean(c)),
    })),
    customData: `<language>en-us</language>`,
  })
}
