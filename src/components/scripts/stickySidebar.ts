/**
 * Sticky Sidebar Controller
 *
 * Provides direction-aware sticky sidebar behavior via JavaScript.
 * Handles both short sidebars (smaller than viewport) and tall sidebars
 * (taller than viewport) with different sticking strategies:
 *
 * SHORT SIDEBAR: Pins the sidebar's top edge below the scroll viewport's
 * top edge (with padding) as the user scrolls down. Returns to natural
 * position when the container scrolls back into view.
 *
 * TALL SIDEBAR: When scrolling down, allows the sidebar to scroll naturally
 * until its bottom edge reaches the viewport bottom (with padding), then
 * pins it there. When scrolling up, releases and scrolls naturally until
 * the top edge reaches the viewport top (with padding), then pins at top.
 *
 * The scroll container is always `#scroll-viewport`, which sits below the
 * header/progress bar in the flex layout. Its BCR top naturally accounts
 * for all fixed chrome above content.
 */
import { handleScriptError } from '@components/scripts/errors/handler'

export interface StickySidebarOptions {
  /** Extra space below the scroll viewport's visible top edge (px). Default: 16 */
  topPadding?: number
  /** Extra space above the scroll viewport's visible bottom edge (px). Default: 16 */
  bottomPadding?: number
  /** Minimum window width to enable sticky behavior (px). Default: 1024 (lg breakpoint) */
  minWidth?: number
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
  options: StickySidebarOptions = {},
): () => void {
  const {
    topPadding = 16,
    bottomPadding = 16,
    minWidth = 1024,
  } = options

  const scrollContainer = document.getElementById('scroll-viewport')
  if (!scrollContainer) {
    return () => {}
  }

  let currentTranslateY = 0
  let rafId: number | null = null
  // Capture scrollContainer in a const to satisfy strict null checks inside closures
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
        return
      }

      const sidebarRect = sidebar.getBoundingClientRect()
      const sidebarHeight = sidebarRect.height
      if (sidebarHeight === 0) return

      const containerRect = container.getBoundingClientRect()
      const viewportRect = scroller.getBoundingClientRect()

      // Sidebar's natural top position (without current transform applied)
      const naturalTop = sidebarRect.top - currentTranslateY

      // Maximum translateY: sidebar bottom must not exceed container bottom
      const maxTranslateY = Math.max(0, containerRect.bottom - (naturalTop + sidebarHeight))

      // Visible bounds within the scroll viewport
      const visibleTop = viewportRect.top + topPadding
      const visibleBottom = viewportRect.bottom - bottomPadding
      const availableHeight = visibleBottom - visibleTop

      let newTranslateY: number

      if (sidebarHeight <= availableHeight) {
        // SHORT SIDEBAR: pin top edge at the visible top boundary
        newTranslateY = Math.max(0, visibleTop - naturalTop)
      } else {
        // TALL SIDEBAR: direction-aware pinning.
        // Top pin: sidebar top aligns with visibleTop
        const topPin = visibleTop - naturalTop
        // Bottom pin: sidebar bottom aligns with visibleBottom
        const bottomPin = visibleBottom - sidebarHeight - naturalTop

        // When the sidebar is taller than available space, topPin > bottomPin.
        // Clamping currentTranslateY between them gives us direction-aware
        // behavior: scrolling down hits the bottom pin, scrolling up hits the
        // top pin, and in between the sidebar scrolls naturally.
        newTranslateY = Math.max(bottomPin, Math.min(currentTranslateY, topPin))
      }

      // Global clamp: never go above natural position or below container bottom
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
