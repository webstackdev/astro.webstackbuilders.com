import type { AstroComponentFactory } from 'astro/runtime/server/index.js'

type MarkerModule = {
  default: AstroComponentFactory
}

export type MarkerComponentMap = Record<string, MarkerModule>

const defaultMarkerComponents = import.meta.glob('../markers/*.astro', {
  eager: true,
}) as MarkerComponentMap

const formatAvailableMarkers = (markerComponents: MarkerComponentMap): string => {
  return Object.keys(markerComponents)
    .map((path) => path.replace('../markers/', ''))
    .sort()
    .join(', ')
}

/**
 * Resolve marker component by icon name.
 * Throws a descriptive error when icon is missing or marker file is not found.
 */
export const getMarkerComponent = (
  icon?: string,
  markerComponents: MarkerComponentMap = defaultMarkerComponents
): AstroComponentFactory => {
  if (!icon) {
    throw new Error(
      'PlainIconList: missing icon value for list item. Expected an icon name that maps to src/components/List/markers/<icon>.astro'
    )
  }

  const iconFileName = `${icon}.astro`
  const iconPath = `../markers/${iconFileName}`
  const markerModule = markerComponents[iconPath]

  if (!markerModule?.default) {
    const availableMarkers = formatAvailableMarkers(markerComponents)

    throw new Error(
      `PlainIconList: marker file "${iconFileName}" was not found in src/components/List/markers/. ` +
      `Requested icon path: "${iconPath}". Available markers: ${availableMarkers || '(none)'}`
    )
  }

  return markerModule.default
}
