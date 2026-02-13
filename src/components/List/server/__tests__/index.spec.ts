import { describe, expect, it } from 'vitest'
import { getMarkerComponent } from '@components/List/server'

describe('getMarkerComponent', () => {
  it('returns marker component when icon exists', () => {
    const markerComponents = {
      '../markers/download.astro': { default: 'DownloadMarker' },
    }

    const markerComponent = getMarkerComponent('download', markerComponents)

    expect(markerComponent).toBe('DownloadMarker')
  })

  it('throws a descriptive error when icon is missing', () => {
    expect(() => getMarkerComponent(undefined, {})).toThrowError(
      'PlainIconList: missing icon value for list item. Expected an icon name that maps to src/components/List/markers/<icon>.astro'
    )
  })

  it('throws a descriptive error when marker file is not found', () => {
    const markerComponents = {
      '../markers/avatar.astro': { default: 'AvatarMarker' },
      '../markers/company.astro': { default: 'CompanyMarker' },
    }

    expect(() => getMarkerComponent('download', markerComponents)).toThrowError(
      'PlainIconList: marker file "download.astro" was not found in src/components/List/markers/. Requested icon path: "../markers/download.astro". Available markers: avatar.astro, company.astro'
    )
  })
})
