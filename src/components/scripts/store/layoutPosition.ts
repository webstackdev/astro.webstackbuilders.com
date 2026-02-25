/**
 * Layout Position Controller
 *
 * Single source of truth for the vertical offset values that coordinate
 * fixed-position elements: the ThemePicker panel, the header, and the
 * progress bar. Every consumer that needs to know "how far from the
 * viewport top does content start?" reads from this store instead of
 * doing its own measurements.
 *
 * CSS custom properties written to `document.documentElement`:
 *   --theme-picker-offset   Height of the open ThemePicker panel (or 0)
 *   --header-current-height Height of the header (accounts for collapse)
 *   --progress-bar-height   Height of the article progress bar (or 0)
 *   --layout-top-offset     Sum of all three (convenience token)
 */
import { atom } from 'nanostores'
import { handleScriptError } from '@components/scripts/errors/handler'

// ============================================================================
// TYPES
// ============================================================================

export interface LayoutOffsets {
  /** Pixel height of the ThemePicker panel when open, else 0 */
  themePickerHeight: number
  /** Pixel height of the fixed header (respects collapsed state) */
  headerHeight: number
  /** Pixel height of the progress bar (or 0 when absent) */
  progressBarHeight: number
}

export type LayoutChangeListener = (offsets: LayoutOffsets) => void

// ============================================================================
// CONSTANTS — DOM selectors used for measurement
// ============================================================================

const THEME_PICKER_MODAL_SELECTOR = '[data-theme-modal]'
const HEADER_FIXED_SELECTOR = '.header-fixed'
const PROGRESS_BAR_SELECTOR = '[data-progress-bar]'
const IS_OPEN_CLASS = 'is-open'

// ============================================================================
// STORE
// ============================================================================

const defaultOffsets: LayoutOffsets = {
  themePickerHeight: 0,
  headerHeight: 0,
  progressBarHeight: 0,
}

export const $layoutOffsets = atom<LayoutOffsets>({ ...defaultOffsets })

// ============================================================================
// CSS VARIABLE WRITER
// ============================================================================

/**
 * Write current offset values to CSS custom properties so CSS-only consumers
 * (e.g. `transform: translateY(var(--theme-picker-offset))`) stay in sync.
 */
function writeCssVariables(offsets: LayoutOffsets): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement.style
  root.setProperty('--theme-picker-offset', `${offsets.themePickerHeight}px`)
  root.setProperty('--header-current-height', `${offsets.headerHeight}px`)
  root.setProperty('--progress-bar-height', `${offsets.progressBarHeight}px`)
  root.setProperty(
    '--layout-top-offset',
    `${offsets.themePickerHeight + offsets.headerHeight + offsets.progressBarHeight}px`,
  )
}

// ============================================================================
// MEASUREMENT HELPERS
// ============================================================================

/**
 * Measure the theme picker modal's rendered height.
 * Returns 0 when the modal is closed or missing.
 */
function measureThemePickerHeight(): number {
  if (typeof document === 'undefined') return 0

  const modal = document.querySelector<HTMLElement>(THEME_PICKER_MODAL_SELECTOR)
  if (!modal || !modal.classList.contains(IS_OPEN_CLASS)) return 0

  const rect = modal.getBoundingClientRect()
  if (rect.height > 0) return rect.height

  // Fallback: compute the CSS 14em target when mid-transition
  const computed = window.getComputedStyle(modal)
  const maxH = Number.parseFloat(computed.maxHeight)
  if (Number.isFinite(maxH) && maxH > 0) return maxH

  // Last resort
  const fontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  ) || 16
  return 14 * fontSize
}

/**
 * Measure the fixed header's rendered height.
 */
function measureHeaderHeight(): number {
  if (typeof document === 'undefined') return 0

  const headerFixed = document.querySelector<HTMLElement>(HEADER_FIXED_SELECTOR)
  if (!headerFixed) return 0

  return headerFixed.getBoundingClientRect().height
}

/**
 * Measure the progress bar's rendered height.
 */
function measureProgressBarHeight(): number {
  if (typeof document === 'undefined') return 0

  const bar = document.querySelector<HTMLElement>(PROGRESS_BAR_SELECTOR)
  if (!bar) return 0

  return bar.getBoundingClientRect().height
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Re-measure every offset element and publish the results to the store
 * and to CSS custom properties. Call this after any event that may change
 * the vertical layout: theme picker open/close, header collapse/expand,
 * window resize, View Transition swap, or progress bar mount/unmount.
 */
export function updateLayoutOffsets(): void {
  try {
    const offsets: LayoutOffsets = {
      themePickerHeight: measureThemePickerHeight(),
      headerHeight: measureHeaderHeight(),
      progressBarHeight: measureProgressBarHeight(),
    }

    $layoutOffsets.set(offsets)
    writeCssVariables(offsets)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'layoutPosition',
      operation: 'updateLayoutOffsets',
    })
  }
}

/**
 * Convenience: returns the total pixel distance from the viewport top to
 * where page content begins (picker + header + progress bar).
 */
export function getTopOffset(): number {
  const o = $layoutOffsets.get()
  return o.themePickerHeight + o.headerHeight + o.progressBarHeight
}

/**
 * Subscribe to layout offset changes. Returns an unsubscribe function.
 */
export function onLayoutChange(listener: LayoutChangeListener): () => void {
  return $layoutOffsets.subscribe(listener)
}

// ============================================================================
// GLOBAL LISTENERS
// ============================================================================

let isLayoutPositionInitialized = false

/**
 * Wire up global listeners (resize, View Transition events) that trigger
 * a re-measure. Safe to call multiple times; only attaches once.
 */
export function initLayoutPositionSideEffects(): void {
  if (typeof window === 'undefined') return
  if (isLayoutPositionInitialized) return
  isLayoutPositionInitialized = true

  const debouncedUpdate = debounceRaf(updateLayoutOffsets)

  window.addEventListener('resize', debouncedUpdate)
  document.addEventListener('astro:after-swap', () => updateLayoutOffsets())
  document.addEventListener('astro:page-load', () => updateLayoutOffsets())

  // Initial measurement
  updateLayoutOffsets()
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Reset internal state — test only.
 */
export function __resetLayoutPositionForTests(): void {
  $layoutOffsets.set({ ...defaultOffsets })
  isLayoutPositionInitialized = false
}

// ============================================================================
// UTILITIES
// ============================================================================

/** Debounce a callback to the next animation frame (collapses rapid calls). */
function debounceRaf(fn: () => void): () => void {
  let rafId: number | null = null
  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = null
      fn()
    })
  }
}
