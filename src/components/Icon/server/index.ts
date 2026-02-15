import type { AstroComponentFactory } from 'astro/runtime/server/index.js'

type IconModule = {
  default: AstroComponentFactory
}

export type IconComponentMap = Record<string, IconModule>

const defaultIconComponents = import.meta.glob('../icons/*.astro', {
  eager: true,
}) as IconComponentMap

const formatAvailableIcons = (markerComponents: IconComponentMap): string => {
  return Object.keys(markerComponents)
    .map((path) => path.replace('../icons/', ''))
    .sort()
    .join(', ')
}

/**
 * Resolve marker component by icon name.
 * Throws a descriptive error when icon is missing or marker file is not found.
 */
export const getIconComponent = (
  icon?: string,
  markerComponents: IconComponentMap = defaultIconComponents
): AstroComponentFactory => {
  if (!icon) {
    throw new Error(
      'PlainIconList: missing icon value for list item. Expected an icon name that maps to src/components/List/markers/<icon>.astro'
    )
  }

  const iconFileName = `${icon}.astro`
  const iconPath = `../icons/${iconFileName}`
  const markerModule = markerComponents[iconPath]

  if (!markerModule?.default) {
    const availableIcons = formatAvailableIcons(markerComponents)

    throw new Error(
      `PlainIconList: marker file "${iconFileName}" was not found in src/components/List/icons/. ` +
      `Requested icon path: "${iconPath}". Available markers: ${availableIcons || '(none)'}`
    )
  }

  return markerModule.default
}
