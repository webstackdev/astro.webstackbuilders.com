/// <reference path="../../../../@types/convert-svg-to-png.d.ts" />
import { describe, expect, test } from '@jest/globals'
import { getCachedFilePaths } from '../../tasks/build:manifest-icons'

describe(`Build manifest icons works`, () => {
  test(`getCachedFilePaths method returns valid paths`, () => {
    const sut = getCachedFilePaths()
    expect(sut.length).toBeGreaterThanOrEqual(2)
    expect(sut[0]).toEqual(expect.any(String))
    expect(sut[1]).toEqual(expect.any(String))
  })
})
