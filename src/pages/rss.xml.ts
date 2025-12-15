import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'
import { ApiFunctionError } from './api/_errors/ApiFunctionError'

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new ApiFunctionError('Missing site URL. Configure `site` in `astro.config.ts` to generate RSS links.', {
      status: 500,
      route: '/rss.xml',
      operation: 'Generate RSS feed',
    })
  }

  const now = new Date()
  const articles = await getCollection('articles', ({ data }) => !data.isDraft && data.publishDate <= now)
  const sortedArticles = articles.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())

  return rss({
    title: 'Webstack Builders Website',
    description:
      'Webstack Builders is a solo software development agency specializing in platform engineering.',
    site: context.site,
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
