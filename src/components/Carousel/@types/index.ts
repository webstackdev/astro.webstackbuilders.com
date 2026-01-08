import type { CollectionEntry } from 'astro:content'
export type CarouselVariant = 'featured' | 'suggested' | 'random'

export const collectionMap = {
  'case-studies': 'caseStudies',
  articles: 'articles',
  services: 'services',
} as const

export type CollectionMap = typeof collectionMap
export type CollectionSlug = keyof CollectionMap
type CollectionEntryMap = {
  [Slug in CollectionSlug]: CollectionEntry<CollectionMap[Slug]>
}

export interface CarouselProps<T extends CollectionSlug = CollectionSlug> {
  title?: string
  titleHref?: string
  limit?: number
  variant?: CarouselVariant
  currentSlug: string
  type: T
  items?: Array<ItemType<T>>
}

export type ItemType<T extends CollectionSlug = CollectionSlug> = CollectionEntryMap[T]
