import { isType1Element } from '@components/scripts/assertions/elements'

export const SELECTORS = {
  prefetchLink: 'link[rel="prefetch"]',
} as const

export const queryPrefetchLink = (root: ParentNode, href: string): HTMLLinkElement | null => {
  if (!href) {
    return null
  }

  const candidate = root.querySelector(`${SELECTORS.prefetchLink}[href="${href}"]`)
  return isType1Element(candidate) && candidate.tagName === 'LINK'
    ? (candidate as HTMLLinkElement)
    : null
}
