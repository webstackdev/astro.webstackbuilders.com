import type { CarouselVariant, ItemType } from '@components/Carousel/@types'

export const prepareItems = (
  allItems: ItemType[],
  variant: CarouselVariant,
  currentSlug: string,
  limit?: number
) => {
  // Filter and sort items based on variant
  let items: ItemType[] = allItems

  switch (variant) {
    case 'featured':
      // Show only featured items, excluding current item
      items = allItems
        .filter((item: ItemType) => {
          if (item.id === currentSlug) return false
          // All collection types now use the consistent "featured" field
          return item.data.featured === true
        })
        .sort(
          (a: ItemType, b: ItemType) =>
            new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime()
        )
      break

    case 'suggested':
      // Filter out current item and get latest items (suggested mode)
      items = allItems
        .filter((item: ItemType) => item.id !== currentSlug)
        .sort(
          (a: ItemType, b: ItemType) =>
            new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime()
        )
      break

    case 'random':
      // Show all items excluding current one in random order
      items = allItems
        .filter((item: ItemType) => item.id !== currentSlug)
        .sort(() => Math.random() - 0.5)
      break
  }

  // Apply limit
  if (limit) {
    items = items.slice(0, limit)
  }

  return items
}
