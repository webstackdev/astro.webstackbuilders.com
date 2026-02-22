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
      'Icon: missing icon value. Expected an icon name that maps to src/components/Icon/icons/<icon>.astro'
    )
  })

  it('throws a descriptive error when marker file is not found', () => {
    const markerComponents = {
      '../icons/avatar.astro': { default: avatarIcon },
      '../icons/company.astro': { default: companyIcon },
    }

    expect(() => getIconComponent('download', markerComponents)).toThrowError(
      'Icon: icon file "download.astro" was not found in src/components/Icon/icons/. Requested icon path: "../icons/download.astro". Available icons: avatar.astro, company.astro'
    )
  })
})
