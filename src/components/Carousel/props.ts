export type CarouselVariant = 'featured' | 'suggested' | 'random'

export type CollectionKeyMap = {
  services: 'services'
  'case-studies': 'caseStudies'
  articles: 'articles'
}

export type CollectionPropName = keyof CollectionKeyMap

export interface CarouselProps<T extends CollectionPropName = CollectionPropName> {
  title?: string
  limit?: number
  variant?: CarouselVariant
  currentSlug: string
  type: T
}
