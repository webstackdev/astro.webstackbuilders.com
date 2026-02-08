// @vitest-environment jsdom
/**
 * Unit tests for header collapse side effects
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetHeaderCollapseForTests,
  initHeaderCollapseSideEffects,
} from '@components/Header/client/index'

const setScrollY = (value: number): void => {
  Object.defineProperty(window, 'scrollY', {
    value,
    writable: true,
    configurable: true,
  })
}

const setupHeaderFixture = (): { headerShell: HTMLElement; header: HTMLElement } => {
  const headerShell = document.createElement('div')
  headerShell.className = 'header-shell'

  const headerFixed = document.createElement('div')
  headerFixed.className = 'header-fixed'

  const header = document.createElement('header')
  header.id = 'header'
  header.setAttribute('data-header-search-open', 'false')

  headerFixed.appendChild(header)
  headerShell.appendChild(headerFixed)
  document.body.appendChild(headerShell)

  return { headerShell, header }
}

describe('Header collapse side effects', () => {
  let rafSpy: ReturnType<typeof vi.spyOn> | null = null

  beforeEach(() => {
    document.body.innerHTML = ''
    setScrollY(0)
    __resetHeaderCollapseForTests()
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = callback => {
        callback(0)
        return 0
      }
    }

    rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(callback => {
        callback(0)
        return 0
      })
  })

  afterEach(() => {
    rafSpy?.mockRestore()
    rafSpy = null
  })

  it('collapses when scrolling down past the threshold', () => {
    const { headerShell } = setupHeaderFixture()

    initHeaderCollapseSideEffects()
    expect(headerShell.classList.contains('is-collapsed')).toBe(false)

    setScrollY(80)
    window.dispatchEvent(new Event('scroll'))

    expect(headerShell.classList.contains('is-collapsed')).toBe(true)
  })

  it('expands when scrolling up', () => {
    const { headerShell } = setupHeaderFixture()

    initHeaderCollapseSideEffects()
    setScrollY(90)
    window.dispatchEvent(new Event('scroll'))
    expect(headerShell.classList.contains('is-collapsed')).toBe(true)

    setScrollY(10)
    window.dispatchEvent(new Event('scroll'))

    expect(headerShell.classList.contains('is-collapsed')).toBe(false)
  })

  it('stays expanded when navigation is open', () => {
    const { headerShell, header } = setupHeaderFixture()

    header.classList.add('aria-expanded-true')
    initHeaderCollapseSideEffects()

    setScrollY(120)
    window.dispatchEvent(new Event('scroll'))

    expect(headerShell.classList.contains('is-collapsed')).toBe(false)
  })
})
