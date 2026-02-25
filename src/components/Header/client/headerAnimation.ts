/**
 * Header Squish Animation
 *
 * Two-step WAAPI animation for the header collapse/expand effect triggered
 * on scroll. Uses the FLIP pattern (First → Last → Invert → Play) to
 * measure before/after states, then animates between them.
 *
 * Collapse (forward):
 *   Step 1 – scale/size reduction (brand, icons, nav text shrink in place)
 *   Step 2 – position shift (items move + header height change)
 *
 * Expand (reverse):
 *   Step 1 – position shift (header height grows + items move)
 *   Step 2 – scale/size growth (brand, icons, nav text grow)
 */
import { handleScriptError } from '@components/scripts/errors/handler'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Single source of truth for header animation timing (ms).
 * Both the collapse WAAPI sequence and the `.header-fixed` CSS translateY
 * transition use this same value (set via --header-transition-duration).
 */
export const HEADER_TRANSITION_DURATION = 320

const EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const COLLAPSED_CLASS = 'is-collapsed'

// ============================================================================
// TYPES
// ============================================================================

interface AnimationElements {
  headerShell: HTMLElement
  siteHeader: HTMLElement
  brand: HTMLElement
  footprint: HTMLElement
  icons: HTMLElement[]
  navLinks: HTMLElement[]
}

interface MeasuredSnapshot {
  brandTransform: string
  headerPaddingTop: string
  headerPaddingBottom: string
  footprintHeight: string
  iconDimensions: { width: string; height: string }[]
  navFontSizes: string[]
}

// ============================================================================
// STATE
// ============================================================================

let isAnimating = false
let currentAnimations: Animation[] = []

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Whether an animation is currently in progress.
 * The scroll handler should skip collapse/expand decisions while true.
 */
export const isHeaderAnimating = (): boolean => isAnimating

/**
 * Animate the header from expanded → collapsed.
 * Returns a Promise that resolves when complete and the `is-collapsed`
 * class is applied.
 */
export const animateCollapse = async (headerShell: HTMLElement): Promise<void> => {
  if (isAnimating) return
  if (headerShell.classList.contains(COLLAPSED_CLASS)) return

  try {
    const elements = queryElements(headerShell)
    if (!elements) {
      headerShell.classList.add(COLLAPSED_CLASS)
      return
    }

    isAnimating = true
    cancelCurrentAnimations()

    // FLIP: measure expanded state
    const from = measureState(elements)

    // FLIP: peek at collapsed state
    headerShell.classList.add(COLLAPSED_CLASS)
    const to = measureState(elements)
    headerShell.classList.remove(COLLAPSED_CLASS)

    // Build 2-step keyframes and play
    const animations = buildAnimations(elements, from, to, 'collapse')
    currentAnimations = animations

    await Promise.all(animations.map(a => a.finished))

    // Apply final CSS class
    headerShell.classList.add(COLLAPSED_CLASS)
  } catch (error) {
    // On error, snap to target state
    headerShell.classList.add(COLLAPSED_CLASS)
    handleScriptError(error, {
      scriptName: 'headerAnimation',
      operation: 'animateCollapse',
    })
  } finally {
    cleanUp()
  }
}

/**
 * Animate the header from collapsed → expanded.
 * Returns a Promise that resolves when complete and the `is-collapsed`
 * class is removed.
 */
export const animateExpand = async (headerShell: HTMLElement): Promise<void> => {
  if (isAnimating) return
  if (!headerShell.classList.contains(COLLAPSED_CLASS)) return

  try {
    const elements = queryElements(headerShell)
    if (!elements) {
      headerShell.classList.remove(COLLAPSED_CLASS)
      return
    }

    isAnimating = true
    cancelCurrentAnimations()

    // FLIP: measure collapsed state
    const from = measureState(elements)

    // FLIP: peek at expanded state
    headerShell.classList.remove(COLLAPSED_CLASS)
    const to = measureState(elements)
    headerShell.classList.add(COLLAPSED_CLASS)

    // Build 2-step keyframes and play
    const animations = buildAnimations(elements, from, to, 'expand')
    currentAnimations = animations

    await Promise.all(animations.map(a => a.finished))

    // Apply final CSS class
    headerShell.classList.remove(COLLAPSED_CLASS)
  } catch (error) {
    // On error, snap to target state
    headerShell.classList.remove(COLLAPSED_CLASS)
    handleScriptError(error, {
      scriptName: 'headerAnimation',
      operation: 'animateExpand',
    })
  } finally {
    cleanUp()
  }
}

// ============================================================================
// DOM QUERIES
// ============================================================================

/**
 * Query all animated elements from the header shell.
 * Returns null if required elements are missing (e.g. during SSR or testing).
 */
function queryElements(headerShell: HTMLElement): AnimationElements | null {
  const siteHeader = headerShell.querySelector<HTMLElement>('.site-header')
  const brand = headerShell.querySelector<HTMLElement>('.header-brand')
  const footprint = headerShell.querySelector<HTMLElement>('.header-footprint')

  if (!siteHeader || !brand || !footprint) return null

  const icons = Array.from(headerShell.querySelectorAll<HTMLElement>('.header-icon'))
  const navLinks = Array.from(
    headerShell.querySelectorAll<HTMLElement>('.header-nav a'),
  )

  return { headerShell, siteHeader, brand, footprint, icons, navLinks }
}

// ============================================================================
// MEASUREMENT
// ============================================================================

/** Snapshot the current computed values of all animated properties. */
function measureState(elements: AnimationElements): MeasuredSnapshot {
  const brandStyle = getComputedStyle(elements.brand)
  const headerStyle = getComputedStyle(elements.siteHeader)
  const footprintStyle = getComputedStyle(elements.footprint)

  return {
    brandTransform: brandStyle.transform || 'none',
    headerPaddingTop: headerStyle.paddingTop || '0px',
    headerPaddingBottom: headerStyle.paddingBottom || '0px',
    footprintHeight: footprintStyle.height || '0px',
    iconDimensions: elements.icons.map(icon => {
      const s = getComputedStyle(icon)
      return { width: s.width || '0px', height: s.height || '0px' }
    }),
    navFontSizes: elements.navLinks.map(link => {
      const s = getComputedStyle(link)
      return s.fontSize || '16px'
    }),
  }
}

// ============================================================================
// ANIMATION BUILDER
// ============================================================================

/**
 * Build WAAPI animations for each element with 3-keyframe sequences.
 *
 * Collapse (forward) — sizes first, then positions:
 *   0%    → expanded values for everything
 *   50%   → collapsed sizes, expanded positions
 *   100%  → collapsed sizes, collapsed positions
 *
 * Expand (reverse) — positions first, then sizes:
 *   0%    → collapsed values for everything
 *   50%   → collapsed sizes, expanded positions
 *   100%  → expanded sizes, expanded positions
 */
function buildAnimations(
  elements: AnimationElements,
  from: MeasuredSnapshot,
  to: MeasuredSnapshot,
  direction: 'collapse' | 'expand',
): Animation[] {
  const opts: KeyframeAnimationOptions = {
    duration: HEADER_TRANSITION_DURATION,
    easing: EASING,
    fill: 'none' as FillMode,
  }

  const animations: Animation[] = []
  const isCollapse = direction === 'collapse'

  // -- Brand transform (scale) — size property
  animations.push(
    elements.brand.animate(
      sizeFirstKeyframes(
        { transform: from.brandTransform },
        { transform: to.brandTransform },
        isCollapse,
      ),
      opts,
    ),
  )

  // -- Site header padding — position property
  animations.push(
    elements.siteHeader.animate(
      positionFirstKeyframes(
        { paddingTop: from.headerPaddingTop, paddingBottom: from.headerPaddingBottom },
        { paddingTop: to.headerPaddingTop, paddingBottom: to.headerPaddingBottom },
        isCollapse,
      ),
      opts,
    ),
  )

  // -- Footprint height — position property
  animations.push(
    elements.footprint.animate(
      positionFirstKeyframes(
        { height: from.footprintHeight },
        { height: to.footprintHeight },
        isCollapse,
      ),
      opts,
    ),
  )

  // -- Icons (width + height) — size property
  elements.icons.forEach((icon, i) => {
    const fromDim = from.iconDimensions[i]
    const toDim = to.iconDimensions[i]
    if (!fromDim || !toDim) return

    animations.push(
      icon.animate(
        sizeFirstKeyframes(
          { width: fromDim.width, height: fromDim.height },
          { width: toDim.width, height: toDim.height },
          isCollapse,
        ),
        opts,
      ),
    )
  })

  // -- Nav links (font-size) — size property
  elements.navLinks.forEach((link, i) => {
    const fromFs = from.navFontSizes[i]
    const toFs = to.navFontSizes[i]
    if (!fromFs || !toFs) return

    animations.push(
      link.animate(
        sizeFirstKeyframes(
          { fontSize: fromFs },
          { fontSize: toFs },
          isCollapse,
        ),
        opts,
      ),
    )
  })

  return animations
}

// ============================================================================
// KEYFRAME HELPERS
// ============================================================================

/**
 * Keyframes for a "size" property:
 *   Collapse → changes in first half, holds in second
 *   Expand   → holds in first half, changes in second
 */
function sizeFirstKeyframes(
  from: Record<string, string>,
  to: Record<string, string>,
  isCollapse: boolean,
): Keyframe[] {
  if (isCollapse) {
    return [
      { ...from, offset: 0 },
      { ...to, offset: 0.5 },
      { ...to, offset: 1 },
    ]
  }
  // Expand: sizes change in second half
  return [
    { ...from, offset: 0 },
    { ...from, offset: 0.5 },
    { ...to, offset: 1 },
  ]
}

/**
 * Keyframes for a "position" property:
 *   Collapse → holds in first half, changes in second
 *   Expand   → changes in first half, holds in second
 */
function positionFirstKeyframes(
  from: Record<string, string>,
  to: Record<string, string>,
  isCollapse: boolean,
): Keyframe[] {
  if (isCollapse) {
    // Position changes in second half
    return [
      { ...from, offset: 0 },
      { ...from, offset: 0.5 },
      { ...to, offset: 1 },
    ]
  }
  // Expand: position changes in first half
  return [
    { ...from, offset: 0 },
    { ...to, offset: 0.5 },
    { ...to, offset: 1 },
  ]
}

// ============================================================================
// CLEANUP
// ============================================================================

function cancelCurrentAnimations(): void {
  currentAnimations.forEach(a => {
    try {
      a.cancel()
    } catch {
      // Animation may already be finished
    }
  })
  currentAnimations = []
}

function cleanUp(): void {
  currentAnimations = []
  isAnimating = false
}
