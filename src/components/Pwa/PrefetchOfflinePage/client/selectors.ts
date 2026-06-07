const OFFLINE_PREFETCH_SELECTOR = 'link[rel="prefetch"][href="/offline"]'

const isHtmlLinkElement = (value: Element | null): value is HTMLLinkElement => {
  return value instanceof HTMLLinkElement
}

/**
 * Returns the existing offline-page prefetch link from the given head element.
 */
export const queryOfflinePagePrefetchLink = (head: HTMLHeadElement): HTMLLinkElement | null => {
  const link = head.querySelector(OFFLINE_PREFETCH_SELECTOR)

  return isHtmlLinkElement(link) ? link : null
}