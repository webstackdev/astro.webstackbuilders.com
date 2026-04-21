/**
 * Sticky Sidebar Controller
 *
 * Provides direction-aware sticky sidebar behavior via JavaScript.
 * Handles both short sidebars (smaller than viewport) and tall sidebars
 * (taller than viewport) with different sticking strategies:
 *
 * SHORT SIDEBAR: Pins the sidebar's top edge below the fixed header
 * (with padding) as the user scrolls down. Returns to natural position
 * when the container scrolls back into view.
 *
 * TALL SIDEBAR: When scrolling down, allows the sidebar to scroll naturally
 * until its bottom edge reaches the viewport bottom (with padding), then
 * pins it there. When scrolling up, releases and scrolls naturally until
 * the top edge reaches the header bottom (with padding), then pins at top.
 *
 * Measures the actual `.header-fixed` and `[data-progress-bar]` elements
 * each frame so the reference point always matches the visual chrome,
 * regardless of header collapse animations or transition timing.
 */
import { handleScriptError } from '@components/scripts/errors/handler'
import { getHeaderFixedElement, getProgressBarElement } from '@components/scripts/store/selectors'

export interface StickySidebarOptions {
  /** Extra space below the fixed chrome (header + progress bar) in px. Default: 16 */
  topPadding?: number
  /** Extra space above the viewport bottom edge in px. Default: 16 */
  bottomPadding?: number
  /** Minimum window width to enable sticky behavior (px). Default: 1024 (lg breakpoint) */
  minWidth?: number
}

/**
 * Compute the visual bottom of all fixed chrome above content.
 * Returns the maximum of header-fixed and progress-bar bottoms.
 */
function measureChromeBottom(): number {
  const headerEl = getHeaderFixedElement()
  const progressEl = getProgressBarElement()
  return Math.max(
    headerEl ? headerEl.getBoundingClientRect().bottom : 0,
    progressEl ? progressEl.getBoundingClientRect().bottom : 0
  )
}

/**
 * Initialize sticky sidebar behavior on a sidebar element within a container.
 *
 * @param sidebar - The element that should stick (e.g. `<aside>`, contact card)
 * @param container - The element whose height constrains the sidebar's vertical travel
 * @param options - Configuration for padding and breakpoint
 * @returns A cleanup function that removes listeners and resets positioning
 */
export function initStickySidebar(
  sidebar: HTMLElement,
  container: HTMLElement,
  options: StickySidebarOptions = {}
): () => void {
  const { topPadding = 16, bottomPadding = 16, minWidth = 1024 } = options

  const scrollContainer = document.getElementById('scroll-viewport')
  if (!scrollContainer) {
    return () => {}
  }

  let currentTranslateY = 0
  let prevScrollTop = scrollContainer.scrollTop
  let rafId: number | null = null
  const scroller = scrollContainer

  /**
   * Compute and apply the correct translateY for the sidebar based on
   * the current scroll position and viewport dimensions.
   */
  function update(): void {
    try {
      // Disable on narrow viewports (mobile drawer handles layout)
      if (window.innerWidth < minWidth) {
        if (currentTranslateY !== 0) {
          sidebar.style.transform = ''
          currentTranslateY = 0
        }
        prevScrollTop = scroller.scrollTop
        return
      }

      const scrollTop = scroller.scrollTop
      const scrollDelta = scrollTop - prevScrollTop
      prevScrollTop = scrollTop

      const sidebarRect = sidebar.getBoundingClientRect()
      const sidebarHeight = sidebarRect.height
      if (sidebarHeight === 0) return

      const containerRect = container.getBoundingClientRect()

      // Visible bounds: measured from actual fixed chrome, not scroll viewport BCR
      const visibleTop = measureChromeBottom() + topPadding
      const visibleBottom = window.innerHeight - bottomPadding
      const availableHeight = visibleBottom - visibleTop

      // Sidebar's natural top position (where it would be with translateY = 0)
      const naturalTop = sidebarRect.top - currentTranslateY

      // Maximum translateY: sidebar bottom must not exceed container bottom
      const maxTranslateY = Math.max(0, containerRect.bottom - (naturalTop + sidebarHeight))

      let newTranslateY: number

      if (sidebarHeight <= availableHeight) {
        // SHORT SIDEBAR: pin top edge at the visible top boundary
        newTranslateY = Math.max(0, visibleTop - naturalTop)
      } else {
        // TALL SIDEBAR: direction-aware pinning
        const actualTop = naturalTop + currentTranslateY
        const actualBottom = actualTop + sidebarHeight

        if (scrollDelta > 0) {
          // Scrolling DOWN: pin bottom at visibleBottom when it would go above
          if (actualBottom < visibleBottom) {
            newTranslateY = visibleBottom - sidebarHeight - naturalTop
          } else {
            newTranslateY = currentTranslateY
          }
        } else if (scrollDelta < 0) {
          // Scrolling UP: pin top at visibleTop when it would go below
          if (actualTop > visibleTop) {
            newTranslateY = visibleTop - naturalTop
          } else {
            newTranslateY = currentTranslateY
          }
        } else {
          newTranslateY = currentTranslateY
        }
      }

      // Clamp: never go above natural position or below container bottom
      newTranslateY = Math.max(0, Math.min(newTranslateY, maxTranslateY))

      // Apply only when value changes meaningfully (avoid sub-pixel jitter)
      if (Math.abs(newTranslateY - currentTranslateY) > 0.5) {
        sidebar.style.transform = `translateY(${Math.round(newTranslateY)}px)`
        currentTranslateY = newTranslateY
      }
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'stickySidebar',
        operation: 'update',
      })
    }
  }

  /** Debounced scroll handler using requestAnimationFrame */
  function onScroll(): void {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = null
      update()
    })
  }

  scroller.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })

  // Initial positioning
  update()

  return () => {
    scroller.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    if (rafId !== null) cancelAnimationFrame(rafId)
    sidebar.style.transform = ''
    currentTranslateY = 0
  }
}
