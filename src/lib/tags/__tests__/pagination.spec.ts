import { describe, expect, it } from 'vitest'

import {
  ITEMS_PER_PAGE,
  buildTagPagePath,
  getTagPageSlice,
  getTagTotalPages,
} from '../pagination'

describe('tag pagination helpers', () => {
  it('builds static tag page paths without query params', () => {
    expect(buildTagPagePath('aws', 1)).toBe('/tags/aws')
    expect(buildTagPagePath('aws', 2)).toBe('/tags/aws/2')
    expect(buildTagPagePath('aws', 3)).toBe('/tags/aws/3')
  })

  it('slices items by page number', () => {
    const items = Array.from({ length: ITEMS_PER_PAGE * 2 + 3 }, (_, index) => index + 1)

    expect(getTagPageSlice(items, 1)).toEqual(items.slice(0, ITEMS_PER_PAGE))
    expect(getTagPageSlice(items, 2)).toEqual(items.slice(ITEMS_PER_PAGE, ITEMS_PER_PAGE * 2))
    expect(getTagPageSlice(items, 3)).toEqual(items.slice(ITEMS_PER_PAGE * 2))
  })

  it('computes total pages from item count', () => {
    expect(getTagTotalPages(0)).toBe(0)
    expect(getTagTotalPages(1)).toBe(1)
    expect(getTagTotalPages(ITEMS_PER_PAGE)).toBe(1)
    expect(getTagTotalPages(ITEMS_PER_PAGE + 1)).toBe(2)
  })
})