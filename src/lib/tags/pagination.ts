import { type CollectionEntry, getCollection, render } from 'astro:content'
import { isDev } from '@lib/config/environmentServer'

export const ITEMS_PER_PAGE = 12

export interface TagPageProps {
  tagEntry: CollectionEntry<'tags'>
  content: Array<CollectionEntry<'articles'>>
  currentPage: number
}

const articleHasTag = (
  article: CollectionEntry<'articles'>,
  tagEntry: CollectionEntry<'tags'>
): boolean => {
  return article.data.tags.some((tagRef: { id: string }) => tagRef.id === tagEntry.id)
}

export const buildTagPagePath = (tag: string, page: number): string => {
  return page <= 1 ? `/tags/${tag}` : `/tags/${tag}/${page}`
}

export const getSortedTagContent = (
  content: Array<CollectionEntry<'articles'>>
): Array<CollectionEntry<'articles'>> => {
  return [...content].sort(
    (a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime()
  )
}

export const getTagPageSlice = <T>(
  content: T[],
  currentPage: number,
  itemsPerPage = ITEMS_PER_PAGE
): T[] => {
  const startIndex = (currentPage - 1) * itemsPerPage
  return content.slice(startIndex, startIndex + itemsPerPage)
}

export const getTagTotalPages = (totalItems: number, itemsPerPage = ITEMS_PER_PAGE): number => {
  return Math.ceil(totalItems / itemsPerPage)
}

const getTagPageCollections = async (): Promise<
  Array<{ tagEntry: CollectionEntry<'tags'>; content: Array<CollectionEntry<'articles'>> }>
> => {
  const allTags = await getCollection('tags')
  const allArticles = await getCollection(
    'articles',
    ({ data }) => isDev() || data.isDraft !== true
  )

  return allTags.map(tagEntry => ({
    tagEntry,
    content: allArticles.filter(article => articleHasTag(article, tagEntry)),
  }))
}

export const getFirstTagPageStaticPaths = async (): Promise<
  Array<{ params: { tag: string }; props: TagPageProps }>
> => {
  const collections = await getTagPageCollections()

  return collections.map(({ tagEntry, content }) => ({
    params: { tag: tagEntry.data.slug },
    props: {
      tagEntry,
      content,
      currentPage: 1,
    },
  }))
}

export const getAdditionalTagPageStaticPaths = async (): Promise<
  Array<{ params: { tag: string; page: string }; props: TagPageProps }>
> => {
  const collections = await getTagPageCollections()

  return collections.flatMap(({ tagEntry, content }) => {
    const totalPages = getTagTotalPages(content.length)
    if (totalPages <= 1) {
      return []
    }

    return Array.from({ length: totalPages - 1 }, (_, index) => {
      const currentPage = index + 2

      return {
        params: {
          tag: tagEntry.data.slug,
          page: String(currentPage),
        },
        props: {
          tagEntry,
          content,
          currentPage,
        },
      }
    })
  })
}

export const renderTagContent = async (tagEntry: CollectionEntry<'tags'>) => {
  return render(tagEntry)
}
