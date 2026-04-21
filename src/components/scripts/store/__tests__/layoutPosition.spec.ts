// @vitest-environment jsdom
/**
 * Unit tests for layoutPosition store
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  $layoutOffsets,
  __resetLayoutPositionForTests,
  getTopOffset,
  initLayoutPositionSideEffects,
  onLayoutChange,
  updateLayoutOffsets,
} from '../layoutPosition'

/**
 * Helper: inject a mock element into the DOM with a specified bounding rect.
 */
function injectElement(tag: string, attrs: Record<string, string>, height: number): HTMLElement {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') {
      value.split(' ').forEach(c => el.classList.add(c))
    } else {
      el.setAttribute(key, value)
    }
  }
  // Mock getBoundingClientRect
  el.getBoundingClientRect = () => ({
    height,
    width: 1000,
    top: 0,
    left: 0,
    right: 1000,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  document.body.appendChild(el)
  return el
}

describe('layoutPosition store', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    __resetLayoutPositionForTests()
  })

  afterEach(() => {
    __resetLayoutPositionForTests()
  })

  it('starts with zero offsets', () => {
    const offsets = $layoutOffsets.get()
    expect(offsets.themePickerHeight).toBe(0)
    expect(offsets.headerHeight).toBe(0)
    expect(offsets.progressBarHeight).toBe(0)
  })

  it('measures header height after updateLayoutOffsets()', () => {
    injectElement('div', { class: 'header-fixed' }, 64)

    updateLayoutOffsets()

    expect($layoutOffsets.get().headerHeight).toBe(64)
  })

  it('measures theme picker height when modal has is-open class', () => {
    injectElement('div', { 'data-theme-modal': '', class: 'is-open' }, 120)

    updateLayoutOffsets()

    expect($layoutOffsets.get().themePickerHeight).toBe(120)
  })

  it('returns 0 for theme picker when modal is closed', () => {
    injectElement('div', { 'data-theme-modal': '' }, 0)

    updateLayoutOffsets()

    expect($layoutOffsets.get().themePickerHeight).toBe(0)
  })

  it('measures progress bar height', () => {
    injectElement('progress', { 'data-progress-bar': '' }, 8)

    updateLayoutOffsets()

    expect($layoutOffsets.get().progressBarHeight).toBe(8)
  })

  it('getTopOffset() returns the sum of all offsets', () => {
    injectElement('div', { 'data-theme-modal': '', class: 'is-open' }, 120)
    injectElement('div', { class: 'header-fixed' }, 64)
    injectElement('progress', { 'data-progress-bar': '' }, 8)

    updateLayoutOffsets()

    expect(getTopOffset()).toBe(120 + 64 + 8)
  })

  it('writes CSS custom properties to document.documentElement', () => {
    injectElement('div', { class: 'header-fixed' }, 64)
    injectElement('div', { 'data-theme-modal': '', class: 'is-open' }, 120)

    updateLayoutOffsets()

    const root = document.documentElement.style
    expect(root.getPropertyValue('--theme-picker-offset')).toBe('120px')
    expect(root.getPropertyValue('--header-current-height')).toBe('64px')
    expect(root.getPropertyValue('--layout-top-offset')).toBe('184px')
  })

  it('notifies subscribers on layout change', () => {
    const listener = vi.fn()
    const unsub = onLayoutChange(listener)

    injectElement('div', { class: 'header-fixed' }, 48)
    updateLayoutOffsets()

    // subscribe fires immediately with the initial value, then again on set
    const lastCall = listener.mock.calls[listener.mock.calls.length - 1]!
    expect(lastCall[0]).toEqual(expect.objectContaining({ headerHeight: 48 }))

    unsub()
  })

  it('initLayoutPositionSideEffects() only attaches once', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')

    initLayoutPositionSideEffects()
    const callCount = addSpy.mock.calls.length

    initLayoutPositionSideEffects()
    const callCountAfter = addSpy.mock.calls.length

    expect(callCountAfter).toBe(callCount)

    addSpy.mockRestore()
  })

  it('sets offsets to 0 when elements are absent', () => {
    updateLayoutOffsets()

    expect($layoutOffsets.get()).toEqual({
      themePickerHeight: 0,
      headerHeight: 0,
      progressBarHeight: 0,
    })
    expect(getTopOffset()).toBe(0)
  })
})
