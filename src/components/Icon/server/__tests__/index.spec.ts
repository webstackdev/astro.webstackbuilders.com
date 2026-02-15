import { describe, expect, it } from 'vitest'
import type { AstroComponentFactory } from 'astro/runtime/server/index.js'
import { getIconComponent } from '@components/Icon/server'

const downloadIcon = (() => null) as unknown as AstroComponentFactory
const avatarIcon = (() => null) as unknown as AstroComponentFactory
const companyIcon = (() => null) as unknown as AstroComponentFactory

describe('getIconComponent', () => {
  it('returns marker component when icon exists', () => {
    const markerComponents = {
      '../icons/download.astro': { default: downloadIcon },
    }

    const markerComponent = getIconComponent('download', markerComponents)

    expect(markerComponent).toBe(downloadIcon)
  })

  it('throws a descriptive error when icon is missing', () => {
    expect(() => getIconComponent(undefined, {})).toThrowError(
      'PlainIconList: missing icon value for list item. Expected an icon name that maps to src/components/List/markers/<icon>.astro'
    )
  })

  it('throws a descriptive error when marker file is not found', () => {
    const markerComponents = {
      '../icons/avatar.astro': { default: avatarIcon },
      '../icons/company.astro': { default: companyIcon },
    }

    expect(() => getIconComponent('download', markerComponents)).toThrowError(
      'PlainIconList: marker file "download.astro" was not found in src/components/List/icons/. Requested icon path: "../icons/download.astro". Available markers: avatar.astro, company.astro'
    )
  })
})
