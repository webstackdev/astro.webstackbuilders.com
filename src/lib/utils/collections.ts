/**
 * Collection utility functions converted from Eleventy filters
 */

/**
 * Gets the full data for the current page from collections using the page's path as a key
 * Usage: getCurrentPage(collections.all, page)
 */
export function getCurrentPage<T extends { url: string }>(collection: T[], page: { url: string }): T | undefined {
  return collection.find(item => item.url === page.url)
}

/**
 * Exclude an item from an array
 * Usage: exclude(article.data.tags, "old")
 */
export function exclude<T>(array: T[], item: T): T[] {
  return array.filter(arrayItem => arrayItem !== item)
}

/**
 * Exclude an item from a collection, like the current page
 * Usage: excludeItemFromCollection(collections.posts, page)
 */
export function excludeItemFromCollection<T extends { url: string }>(
  collection: T[],
  currentPage: { url: string }
): T[] {
  return collection.filter(item => item.url !== currentPage.url)
}

/**
 * Find item in associative array by key
 * Usage: findById(themes, 'dark')
 */
export function findById<T extends { id: string }>(array: T[], id: string): T | undefined {
  return array.find(item => item.id === id)
}

/**
 * Slice array to get last N items
 * Usage: slice(collections.posts, -10)
 */
export function slice<T>(array: T[], start?: number, end?: number): T[] {
  return array.slice(start, end)
}

/**
 * Filter a collection by category
 * Usage: withCategory(collections.categories, "articles")
 */
export function withCategory<T extends { category?: string }>(
  collection: T[],
  category: string
): T[] {
  return collection.filter(item => item.category === category)
}