import { afterEach, describe, expect, it, vi } from 'vitest'
import { prepareItems } from '@components/Carousel/server'
import { cloneArticleCollection } from '@components/Carousel/server/__fixtures__/collection.fixture'

const createItems = () => cloneArticleCollection()

describe('prepareItems', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('filters featured items and sorts by newest publish date', () => {
    const result = prepareItems(createItems(), 'featured', 'article-bravo')

    expect(result.map(item => item.id)).toEqual(['article-delta', 'article-alpha'])
    expect(result.every(item => ('featured' in item.data ? item.data.featured : false))).toBe(
      true
    )
    expect(result).toHaveLength(2)
  })

  it('returns suggested items ordered by publish date without the current slug', () => {
    const result = prepareItems(createItems(), 'suggested', 'article-alpha')

    expect(result.map(item => item.id)).toEqual([
      'article-delta',
      'article-charlie',
      'article-bravo',
    ])
    expect(result).toHaveLength(3)
    expect(result.find(item => item.id === 'article-alpha')).toBeUndefined()
  })

  it('applies the requested limit after filtering', () => {
    const limited = prepareItems(createItems(), 'suggested', 'article-alpha', 1)

    expect(limited).toHaveLength(1)
    expect(limited[0]?.id).toBe('article-delta')
  })

  it('invokes Math.random when shuffling for the random variant and excludes the current slug', () => {
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9)

    const randomItems = prepareItems(createItems(), 'random', 'article-charlie', 3)

    expect(mathSpy).toHaveBeenCalled()
    expect(randomItems).toHaveLength(3)
    expect(randomItems.find(item => item.id === 'article-charlie')).toBeUndefined()
  })

  it('does not filter when currentSlug is undefined', () => {
    const result = prepareItems(createItems(), 'suggested')
    expect(result).toHaveLength(4)
  })
})
