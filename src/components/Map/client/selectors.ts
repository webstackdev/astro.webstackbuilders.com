/**
 * Type-safe DOM selectors for the Map component.
 */
import { isDivElement, isType1Element } from '@components/scripts/assertions/elements'

export const SELECTORS = {
  root: '[data-company-map]',
  loader: 'gmpx-api-loader',
  map: 'gmp-map',
  marker: 'gmp-advanced-marker',
}

export type CompanyMapLoaderElement = Element & {
  key: string
}

export const isCompanyMapLoaderElement = (element: unknown): element is CompanyMapLoaderElement => {
  if (!isType1Element(element)) return false
  if (element.tagName !== 'GMPX-API-LOADER') return false
  return true
}

export const queryCompanyMapRoots = (context: ParentNode): HTMLDivElement[] => {
  return Array.from(context.querySelectorAll(SELECTORS.root)).filter(isDivElement)
}

export const queryCompanyMapLoaderElement = (root: ParentNode): CompanyMapLoaderElement | null => {
  const loader = root.querySelector(SELECTORS.loader)
  if (!isCompanyMapLoaderElement(loader)) return null
  return loader
}

export const queryCompanyMapElement = (root: ParentNode): Element | null => {
  return root.querySelector(SELECTORS.map)
}

export const queryCompanyMapMarkerElement = (root: ParentNode): Element | null => {
  return root.querySelector(SELECTORS.marker)
}

export const getCompanyMapAddress = (root: HTMLElement): string => {
  return root.getAttribute('data-address') ?? ''
}
