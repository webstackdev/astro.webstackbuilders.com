// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initStickySidebar } from '@components/scripts/stickySidebar'

/**
 * The sticky sidebar pins SHORT sidebars just below the fixed chrome:
 * translateY = max(0, chromeBottom + topPadding - naturalTop).
 * These tests drive that path with a sidebar shorter than the viewport.
 */

const SIDEBAR_HEIGHT = 400
const TALL_SIDEBAR_HEIGHT = 1200
const NATURAL_TOP = 100
const CONTAINER_BOTTOM = 10_000

interface PageState {
  chromeBottom: number
  /** Document offset of the sidebar before transforms; natural top = docTop - scrollTop */
  docTop: number
  sidebarHeight: number
}

let headerEl: HTMLElement
let progressEl: HTMLElement
let scroller: HTMLElement
let container: HTMLElement
let sidebar: HTMLElement
let state: PageState

/** ResizeObserver test double: captures the callback so tests can fire it. */
let roCallback: (() => void) | null
let observeSpy: ReturnType<typeof vi.fn>
let disconnectSpy: ReturnType<typeof vi.fn>

class FakeResizeObserver {
  constructor(callback: () => void) {
    roCallback = callback
  }
  observe = observeSpy
  unobserve = vi.fn()
  disconnect = disconnectSpy
}

const rect = (top: number, height: number): DOMRect =>
  ({
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 300,
    width: 300,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect

/** Sidebar top tracks the scroll position plus any applied transform. */
function currentSidebarTop(): number {
  const match = /translateY\((-?\d+(?:\.\d+)?)px\)/.exec(sidebar.style.transform)
  return state.docTop - scroller.scrollTop + (match ? Number(match[1]) : 0)
}

/** Wait long enough for the rAF-debounced update to run. */
const flushUpdate = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 40))

function setupDom(): void {
  document.body.innerHTML = `
    <header class="header-fixed"><span id="header-child"></span></header>
    <div data-progress-bar></div>
    <div id="scroll-viewport"><div id="container"><aside id="sidebar"></aside></div></div>
  `
  headerEl = document.querySelector('.header-fixed') as HTMLElement
  progressEl = document.querySelector('[data-progress-bar]') as HTMLElement
  scroller = document.getElementById('scroll-viewport') as HTMLElement
  container = document.getElementById('container') as HTMLElement
  sidebar = document.getElementById('sidebar') as HTMLElement

  state = { chromeBottom: 104, docTop: NATURAL_TOP, sidebarHeight: SIDEBAR_HEIGHT }

  headerEl.getBoundingClientRect = () => rect(0, state.chromeBottom)
  progressEl.getBoundingClientRect = () => rect(0, 0)
  sidebar.getBoundingClientRect = () => rect(currentSidebarTop(), state.sidebarHeight)
  container.getBoundingClientRect = () => rect(-1000, CONTAINER_BOTTOM + 1000)

  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 })
}

beforeEach(() => {
  roCallback = null
  observeSpy = vi.fn()
  disconnectSpy = vi.fn()
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  setupDom()
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('initStickySidebar chrome tracking', () => {
  it('pins a short sidebar below the measured chrome on init', () => {
    initStickySidebar(sidebar, container)
    // visibleTop = 104 + 16 = 120; naturalTop = 100 -> translateY(20px)
    expect(sidebar.style.transform).toBe('translateY(20px)')
    expect(observeSpy).toHaveBeenCalledWith(headerEl)
    expect(observeSpy).toHaveBeenCalledWith(progressEl)
  })

  it('re-measures when the header resizes (WAAPI squish path)', async () => {
    initStickySidebar(sidebar, container)
    expect(sidebar.style.transform).toBe('translateY(20px)')

    // Header squishes after the scroll stops: chrome bottom 104 -> 60
    state.chromeBottom = 60
    roCallback?.()
    await flushUpdate()

    // visibleTop = 60 + 16 = 76 < naturalTop 100 -> back to natural position
    expect(sidebar.style.transform).toBe('translateY(0px)')
  })

  it('re-measures when the header transform transition ends', async () => {
    initStickySidebar(sidebar, container)
    state.chromeBottom = 60
    headerEl.dispatchEvent(new Event('transitionend'))
    await flushUpdate()

    expect(sidebar.style.transform).toBe('translateY(0px)')
  })

  it('ignores transitionend events bubbling from header children', async () => {
    initStickySidebar(sidebar, container)
    const child = document.getElementById('header-child') as HTMLElement
    state.chromeBottom = 60
    child.dispatchEvent(new Event('transitionend', { bubbles: true }))
    await flushUpdate()

    // Target filter rejects the event; stale transform remains
    expect(sidebar.style.transform).toBe('translateY(20px)')
  })

  it('cleanup disconnects the observer and removes the transition listener', async () => {
    const destroy = initStickySidebar(sidebar, container)
    destroy()

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
    expect(sidebar.style.transform).toBe('')

    state.chromeBottom = 60
    headerEl.dispatchEvent(new Event('transitionend'))
    await flushUpdate()
    expect(sidebar.style.transform).toBe('')
  })

  it('still tracks scroll when ResizeObserver is unavailable', async () => {
    vi.stubGlobal('ResizeObserver', undefined)
    initStickySidebar(sidebar, container)
    expect(sidebar.style.transform).toBe('translateY(20px)')

    state.chromeBottom = 60
    scroller.dispatchEvent(new Event('scroll'))
    await flushUpdate()
    expect(sidebar.style.transform).toBe('translateY(0px)')
  })
})

describe('initStickySidebar tall sidebar pin tracking', () => {
  const scrollTo = (top: number): void => {
    scroller.scrollTop = top
    scroller.dispatchEvent(new Event('scroll'))
  }

  it('re-attaches a top pin when the chrome moves without a scroll event', async () => {
    state.sidebarHeight = TALL_SIDEBAR_HEIGHT
    state.docTop = 600
    initStickySidebar(sidebar, container)

    // Scroll down past the sidebar: it drifts, then bottom-pins
    scrollTo(800)
    await flushUpdate()
    expect(sidebar.style.transform).toBe('')
    scrollTo(1000)
    await flushUpdate()
    // bottom pin: 884 - 1200 - (600 - 1000) = 84
    expect(sidebar.style.transform).toBe('translateY(84px)')

    // Scroll back up: releases from the bottom, then top-pins
    scrollTo(600)
    await flushUpdate()
    expect(sidebar.style.transform).toBe('translateY(84px)')
    scrollTo(500)
    await flushUpdate()
    // top pin: visibleTop 120 - naturalTop (600 - 500) = 20
    expect(sidebar.style.transform).toBe('translateY(20px)')

    // Header EXPANDS after the scroll stops (chrome bottom 104 -> 140).
    // The top-pinned sidebar must track to the new pin line without a scroll.
    state.chromeBottom = 140
    roCallback?.()
    await flushUpdate()
    // visibleTop = 140 + 16 = 156 -> 156 - 100 = 56
    expect(sidebar.style.transform).toBe('translateY(56px)')

    // Header then squishes below the natural position: clamped to natural
    state.chromeBottom = 60
    roCallback?.()
    await flushUpdate()
    expect(sidebar.style.transform).toBe('translateY(0px)')
  })
})
