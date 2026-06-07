import { queryOfflinePagePrefetchLink } from './selectors'

const OFFLINE_PAGE_HREF = '/offline'

/**
 * Appends a single prefetch hint for the offline page.
 */
export const appendOfflinePagePrefetchLink = (doc?: Document): void => {
  if (!doc?.head || queryOfflinePagePrefetchLink(doc.head)) {
    return
  }

  const link = doc.createElement('link')
  link.rel = 'prefetch'
  link.href = OFFLINE_PAGE_HREF
  doc.head.append(link)
}

/**
 * Queues the offline page prefetch hint for browser idle time.
 */
export const queueOfflinePagePrefetch = (options?: {
  win?: Window
  doc?: Document
}): void => {
  const win = options?.win ?? (typeof window === 'undefined' ? undefined : window)
  const doc = options?.doc ?? (typeof document === 'undefined' ? undefined : document)

  if (!win || !doc) {
    return
  }

  const appendPrefetchLink = () => appendOfflinePagePrefetchLink(doc)

  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(() => appendPrefetchLink())
    return
  }

  win.setTimeout(() => appendPrefetchLink(), 500)
}