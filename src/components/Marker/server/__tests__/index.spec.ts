import { describe, expect, it } from 'vitest'
import type { AstroComponentFactory } from 'astro/runtime/server/index.js'
import { getMarkerComponent } from '@components/List/server'

const downloadMarker = (() => null) as unknown as AstroComponentFactory
const avatarMarker = (() => null) as unknown as AstroComponentFactory
const companyMarker = (() => null) as unknown as AstroComponentFactory

describe('getMarkerComponent', () => {
  it('returns marker component when icon exists', () => {
    const markerComponents = {
      '../icons/download.astro': { default: downloadMarker },
    }

    const markerComponent = getMarkerComponent('download', markerComponents)

    expect(markerComponent).toBe(downloadMarker)
  })

  it('throws a descriptive error when icon is missing', () => {
    expect(() => getMarkerComponent(undefined, {})).toThrowError(
      'PlainIconList: missing icon value for list item. Expected an icon name that maps to src/components/List/markers/<icon>.astro'
    )
  })

  it('throws a descriptive error when marker file is not found', () => {
    const markerComponents = {
      '../icons/avatar.astro': { default: avatarMarker },
      '../icons/company.astro': { default: companyMarker },
    }

    expect(() => getMarkerComponent('download', markerComponents)).toThrowError(
      'PlainIconList: marker file "download.astro" was not found in src/components/List/icons/. Requested icon path: "../icons/download.astro". Available markers: avatar.astro, company.astro'
    )
  })
})
