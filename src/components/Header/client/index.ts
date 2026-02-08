/**
 * Header collapse side effects
 *
 * Handles scroll-based collapsing for the fixed header shell without relying on shared state.
 */
import { handleScriptError } from '@components/scripts/errors/handler'
import { isType1Element } from '@components/scripts/assertions/elements'
import { getHeaderElement, getHeaderShellElement } from './selectors'

const COLLAPSED_CLASS = 'is-collapsed'
/**
 * Minimum scroll delta (in pixels) required before we treat movement as intentional,
 * preventing tiny scroll jitter from toggling the header state.
 */
const SCROLL_TOLERANCE = 4
/**
 * Scroll position (in pixels from the top) beyond which the header may collapse
 * while scrolling downward. This keeps the header full-size near the top.
 */
const COLLAPSE_THRESHOLD = 48
/**
 * Scroll position (in pixels from the top) below which the header always expands,
 * regardless of scroll direction, so the header is restored as you return upward.
 */
const EXPAND_THRESHOLD = 24

let isHeaderCollapseInitialized = false
let teardownListeners: (() => void) | null = null
let pageLoadListener: (() => void) | null = null
let headerObserver: MutationObserver | null = null

interface HeaderCollapseState {
  headerShell: HTMLElement
  header: HTMLElement
  lastScrollY: number
  isCollapsed: boolean
  isTicking: boolean
}

const getDocumentScrollTop = (): number => {
  const { body, documentElement, scrollingElement } = document
  if (scrollingElement) {
    return scrollingElement.scrollTop
  }
  if (documentElement) {
    return documentElement.scrollTop
  }
  if (body) {
    return body.scrollTop
  }
  return 0
}

const hasScrollTop = (element: unknown): element is HTMLElement => {
  return isType1Element(element) && 'scrollTop' in element
}

// Use the event target when scrolling happens inside a container.
const getScrollTop = (event?: Event): number => {
  const target = event?.target
  const targetScrollTop =
    hasScrollTop(target) ? target.scrollTop : 0
  const documentScrollTop = getDocumentScrollTop()
  const windowScrollTop = typeof window.scrollY === 'number' ? window.scrollY : 0

  return Math.max(targetScrollTop, documentScrollTop, windowScrollTop)
}

const shouldForceExpanded = (header: HTMLElement): boolean => {
  const isSearchOpen = header.getAttribute('data-header-search-open') === 'true'
  const isNavOpen = header.classList.contains('aria-expanded-true')
  return isSearchOpen || isNavOpen
}

const setCollapsedState = (state: HeaderCollapseState, nextCollapsed: boolean): void => {
  if (state.isCollapsed === nextCollapsed) {
    return
  }

  state.isCollapsed = nextCollapsed
  state.headerShell.classList.toggle(COLLAPSED_CLASS, nextCollapsed)
}

// Determines the collapsed state based on scroll position and direction.
const createUpdateHandler = (state: HeaderCollapseState) => (nextScrollY?: number) => {
  const currentScrollY = typeof nextScrollY === 'number' ? nextScrollY : getScrollTop()
  const scrollDelta = currentScrollY - state.lastScrollY
  const isScrollingDown = scrollDelta > SCROLL_TOLERANCE

  if (shouldForceExpanded(state.header)) {
    setCollapsedState(state, false)
    state.lastScrollY = currentScrollY
    return
  }

  if (currentScrollY <= EXPAND_THRESHOLD || scrollDelta < -SCROLL_TOLERANCE) {
    setCollapsedState(state, false)
    state.lastScrollY = currentScrollY
    return
  }

  if (!state.isCollapsed && currentScrollY >= COLLAPSE_THRESHOLD && isScrollingDown) {
    setCollapsedState(state, true)
  }

  state.lastScrollY = currentScrollY
}

const createScrollHandler = (state: HeaderCollapseState, update: (_nextScrollY?: number) => void) => (
  event?: Event,
) => {
  if (state.isTicking) {
    return
  }

  state.isTicking = true

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      state.isTicking = false
      update(getScrollTop(event))
    })
    return
  }

  state.isTicking = false
  update(getScrollTop(event))
}

const attachHeaderCollapse = (): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  let headerShell: HTMLElement
  let header: HTMLElement

  try {
    headerShell = getHeaderShellElement(document)
    header = getHeaderElement(document)
  } catch {
    return false
  }

  teardownListeners?.()

  const state: HeaderCollapseState = {
    headerShell,
    header,
    lastScrollY: getScrollTop(),
    isCollapsed:
      headerShell.classList.contains(COLLAPSED_CLASS) || getScrollTop() > COLLAPSE_THRESHOLD,
    isTicking: false,
  }

  const update = createUpdateHandler(state)
  const handleScroll = createScrollHandler(state, update)

  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('scroll', handleScroll, { passive: true, capture: true })
  window.addEventListener('resize', handleScroll)

  update()

  teardownListeners = () => {
    window.removeEventListener('scroll', handleScroll)
    document.removeEventListener('scroll', handleScroll, { capture: true })
    window.removeEventListener('resize', handleScroll)
  }

  return true
}

/**
 * Initialize DOM side effects for the fixed header collapse behavior.
 */
export function initHeaderCollapseSideEffects(): void {
  if (isHeaderCollapseInitialized) {
    return
  }

  isHeaderCollapseInitialized = true

  try {
    const attached = attachHeaderCollapse()

    if (!attached && !headerObserver && typeof MutationObserver === 'function') {
      headerObserver = new MutationObserver(() => {
        const didAttach = attachHeaderCollapse()
        if (didAttach) {
          headerObserver?.disconnect()
          headerObserver = null
        }
      })

      headerObserver.observe(document.body, { childList: true, subtree: true })
    }

    if (!pageLoadListener) {
      pageLoadListener = () => {
        attachHeaderCollapse()
      }

      document.addEventListener('astro:page-load', pageLoadListener)
      document.addEventListener('DOMContentLoaded', pageLoadListener)
    }
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'headerCollapse',
      operation: 'initHeaderCollapseSideEffects',
    })
  }
}

/**
 * Test-only reset for header collapse side effects.
 */
export function __resetHeaderCollapseForTests(): void {
  teardownListeners?.()
  teardownListeners = null
  headerObserver?.disconnect()
  headerObserver = null
  if (pageLoadListener) {
    document.removeEventListener('astro:page-load', pageLoadListener)
    document.removeEventListener('DOMContentLoaded', pageLoadListener)
    pageLoadListener = null
  }
  isHeaderCollapseInitialized = false
}
