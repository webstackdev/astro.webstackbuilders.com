// @vitest-environment jsdom
/**
 * Unit tests for header search state management
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  __resetHeaderSearchForTests,
  closeHeaderSearch,
  getHeaderSearchExpanded,
  initHeaderSearchSideEffects,
  openHeaderSearch,
  setHeaderSearchExpanded,
  toggleHeaderSearch,
  $headerSearchExpanded,
} from '@components/scripts/store/search'

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

describe('Header search store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    __resetHeaderSearchForTests()
    vi.clearAllMocks()
  })

  it('defaults to collapsed', () => {
    expect(getHeaderSearchExpanded()).toBe(false)
  })

  it('can open/close/toggle', () => {
    openHeaderSearch()
    expect(getHeaderSearchExpanded()).toBe(true)

    closeHeaderSearch()
    expect(getHeaderSearchExpanded()).toBe(false)

    toggleHeaderSearch()
    expect(getHeaderSearchExpanded()).toBe(true)
  })

  it('persists expanded state to localStorage', () => {
    setHeaderSearchExpanded(true)
    expect($headerSearchExpanded.get()).toBe(true)

    // persistentAtom stores JSON strings for this store
    expect(localStorage.getItem('headerSearchExpanded')).toBe('true')
  })

  it('updates #header data attribute via side effects', () => {
    const header = document.createElement('header')
    header.id = 'header'
    document.body.appendChild(header)

    initHeaderSearchSideEffects()
    expect(header.getAttribute('data-header-search-open')).toBe('false')

    openHeaderSearch()
    expect(header.getAttribute('data-header-search-open')).toBe('true')

    closeHeaderSearch()
    expect(header.getAttribute('data-header-search-open')).toBe('false')
  })

  it('reports errors when side effects initialization fails', () => {
    const error = new Error('listener failure')
    const listenSpy = vi.spyOn($headerSearchExpanded, 'listen').mockImplementation(() => {
      throw error
    })

    initHeaderSearchSideEffects()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'search',
      operation: 'initHeaderSearchSideEffects',
    })

    listenSpy.mockRestore()
  })
})
