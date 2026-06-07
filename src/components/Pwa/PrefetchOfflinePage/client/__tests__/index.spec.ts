// @vitest-environment jsdom

import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  appendOfflinePagePrefetchLink,
  queueOfflinePagePrefetch,
} from '@components/Pwa/PrefetchOfflinePage/client'

describe('appendOfflinePagePrefetchLink', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  test('adds a prefetch link for the offline page', () => {
    appendOfflinePagePrefetchLink(document)

    const link = document.head.querySelector('link[rel="prefetch"][href="/offline"]')

    expect(link).toBeInstanceOf(HTMLLinkElement)
  })

  test('does not add a duplicate prefetch link', () => {
    appendOfflinePagePrefetchLink(document)
    appendOfflinePagePrefetchLink(document)

    const links = document.head.querySelectorAll('link[rel="prefetch"][href="/offline"]')

    expect(links).toHaveLength(1)
  })
})

describe('queueOfflinePagePrefetch', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  test('uses requestIdleCallback when available', () => {
    let idleCallback: (() => void) | undefined
    const setTimeoutMock = vi.fn()
    const win = {
      requestIdleCallback: vi.fn((callback: () => void) => {
        idleCallback = callback
        return 1
      }),
      setTimeout: setTimeoutMock,
    } as unknown as Window

    queueOfflinePagePrefetch({ win, doc: document })

    expect(document.head.querySelector('link[rel="prefetch"][href="/offline"]')).toBeNull()
    expect(setTimeoutMock).not.toHaveBeenCalled()

    idleCallback?.()

    expect(document.head.querySelector('link[rel="prefetch"][href="/offline"]')).toBeTruthy()
  })

  test('falls back to setTimeout when requestIdleCallback is unavailable', () => {
    const setTimeoutMock = vi.fn((callback: () => void) => {
      callback()
      return 1
    })
    const win = {
      setTimeout: setTimeoutMock,
    } as unknown as Window

    queueOfflinePagePrefetch({ win, doc: document })

    expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 500)
    expect(document.head.querySelector('link[rel="prefetch"][href="/offline"]')).toBeTruthy()
  })
})