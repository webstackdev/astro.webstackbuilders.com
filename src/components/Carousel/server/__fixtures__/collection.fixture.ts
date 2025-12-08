import type { ItemType } from '@components/Carousel/@types'

type MinimalCarouselEntry = {
  id: string
  slug: string
  collection: 'articles'
  data: {
    title: string
    description: string
    publishDate: Date
    featured: boolean
    icon?: string
  }
}

const entries: MinimalCarouselEntry[] = [
  {
    id: 'article-delta',
    slug: 'article-delta',
    collection: 'articles',
    data: {
      title: 'Article Delta',
      description: 'Latest launch deep-dive',
      publishDate: new Date('2024-04-15T00:00:00.000Z'),
      featured: true,
      icon: '/icons/delta.svg',
    },
  },
  {
    id: 'article-charlie',
    slug: 'article-charlie',
    collection: 'articles',
    data: {
      title: 'Article Charlie',
      description: 'Scaling case study',
      publishDate: new Date('2024-03-10T00:00:00.000Z'),
      featured: false,
    },
  },
  {
    id: 'article-bravo',
    slug: 'article-bravo',
    collection: 'articles',
    data: {
      title: 'Article Bravo',
      description: 'Platform roadmap',
      publishDate: new Date('2024-02-20T00:00:00.000Z'),
      featured: true,
    },
  },
  {
    id: 'article-alpha',
    slug: 'article-alpha',
    collection: 'articles',
    data: {
      title: 'Article Alpha',
      description: 'Foundational principles',
      publishDate: new Date('2024-01-05T00:00:00.000Z'),
      featured: true,
    },
  },
]

export const articleCollectionFixture = entries as unknown as ItemType<'articles'>[]

export const cloneArticleCollection = () =>
  articleCollectionFixture.map(item => ({
    ...item,
    data: {
      ...item.data,
      publishDate: new Date(item.data.publishDate),
    },
  })) as ItemType<'articles'>[]

export default articleCollectionFixture
