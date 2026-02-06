import type { CarouselVariant, ItemType } from '@components/Carousel/@types'

const getPublishDateMs = (item: ItemType): number => {
  if (!('publishDate' in item.data)) return 0
  const { publishDate } = item.data
  if (!publishDate) return 0
  if (publishDate instanceof Date) return publishDate.getTime()
  const parsed = new Date(publishDate).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

const isFeatured = (item: ItemType): boolean =>
  'featured' in item.data && item.data.featured === true

export const prepareItems = (
  allItems: ItemType[],
  variant: CarouselVariant,
  currentSlug?: string,
  limit?: number
) => {
  // Filter and sort items based on variant
  let items: ItemType[] = allItems

  switch (variant) {
    case 'featured':
      // Show only featured items, excluding current item
      items = allItems
        .filter((item: ItemType) => {
          if (currentSlug && item.id === currentSlug) return false
          // All collection types now use the consistent "featured" field
          return isFeatured(item)
        })
        .sort(
          (a: ItemType, b: ItemType) =>
            getPublishDateMs(b) - getPublishDateMs(a)
        )
      break

    case 'suggested':
      // Filter out current item and get latest items (suggested mode)
      items = allItems
        .filter((item: ItemType) => (currentSlug ? item.id !== currentSlug : true))
        .sort(
          (a: ItemType, b: ItemType) =>
            getPublishDateMs(b) - getPublishDateMs(a)
        )
      break

    case 'random':
      // Show all items excluding current one in random order
      items = allItems
        .filter((item: ItemType) => (currentSlug ? item.id !== currentSlug : true))
        .sort(() => Math.random() - 0.5)
      break
  }

  // Apply limit
  if (limit) {
    items = items.slice(0, limit)
  }

  return items
}
