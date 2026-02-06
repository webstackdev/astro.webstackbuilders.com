import type { ImageMetadata } from 'astro'
import type { CollectionEntry } from 'astro:content'

export type CarouselVariant = 'featured' | 'suggested' | 'random'

export type CarouselNavigationMode = 'wrap' | 'bounded'

export const collectionMap = {
  'case-studies': 'caseStudies',
  articles: 'articles',
} as const

export type CollectionMap = typeof collectionMap
export type KnownCollectionSlug = keyof CollectionMap
export type CollectionSlug = KnownCollectionSlug | 'unknown'

export type UnknownCarouselItem = {
  id: string
  href: string
  data: {
    title: string
    description?: string
    cover?: ImageMetadata
    coverAlt?: string
    featured?: boolean
    publishDate?: Date | string
  }
}

type CollectionEntryMap = {
  [Slug in KnownCollectionSlug]: CollectionEntry<CollectionMap[Slug]>
}

type BaseCarouselProps = {
  title?: string
  titleHref?: string
  limit?: number
  variant?: CarouselVariant
  /** Used to filter out the current item from the carousel when provided */
  currentSlug?: string
  /** Controls whether next/prev buttons wrap around */
  navigationMode?: CarouselNavigationMode
}

export type CarouselProps =
  | (BaseCarouselProps & {
      /** Type of collection: articles, case-studies, or services */
      type: KnownCollectionSlug
      /** Caller can pass items in or let the component fetch them */
      items?: Array<ItemType<KnownCollectionSlug>>
    })
  | (BaseCarouselProps & {
      /** Unknown type requires explicit items */
      type: 'unknown'
      items: UnknownCarouselItem[]
    })

export type ItemType<T extends CollectionSlug = CollectionSlug> =
  T extends KnownCollectionSlug ? CollectionEntryMap[T] : UnknownCarouselItem
