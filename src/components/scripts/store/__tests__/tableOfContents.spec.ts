// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestError } from '@test/errors'
import {
  $isTableOfContentsEnabled,
  $isTableOfContentsVisible,
  $visibility,
  disableTableOfContents,
  enableTableOfContents,
  hideTableOfContents,
  showTableOfContents,
  toggleTableOfContents,
} from '@components/scripts/store/tableOfContents'
import { handleScriptError } from '@components/scripts/errors/handler'

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

const getTableOfContentsVisibility = (): boolean => $isTableOfContentsVisible.get()
const getTableOfContentsEnabled = (): boolean => $isTableOfContentsEnabled.get()

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('UI visibility state management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    hideTableOfContents()
    enableTableOfContents()
  })

  it('defaults to a hidden table of contents', () => {
    expect(getTableOfContentsEnabled()).toBe(true)
    expect(getTableOfContentsVisibility()).toBe(false)
  })

  it('shows the table of contents when enabled', () => {
    showTableOfContents()

    expect(getTableOfContentsVisibility()).toBe(true)
  })

  it('does not show the table of contents when disabled', () => {
    disableTableOfContents()
    showTableOfContents()

    expect(getTableOfContentsEnabled()).toBe(false)
    expect(getTableOfContentsVisibility()).toBe(false)
  })

  it('toggles the table of contents visibility state', () => {
    expect(getTableOfContentsVisibility()).toBe(false)

    toggleTableOfContents()
    expect(getTableOfContentsVisibility()).toBe(true)

    toggleTableOfContents()
    expect(getTableOfContentsVisibility()).toBe(false)
  })
})

describe('UI visibility error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports errors when showing the banner fails', () => {
    const error = new TestError('show failure')
    vi.spyOn($visibility, 'set').mockImplementation(() => {
      throw error
    })

    showTableOfContents()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'visibility',
      operation: 'showTableOfContents',
    })
  })

  it('reports errors when hiding the table of contents fails', () => {
    const error = new TestError('hide failure')
    vi.spyOn($visibility, 'set').mockImplementation(() => {
      throw error
    })

    hideTableOfContents()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'visibility',
      operation: 'hideTableOfContents',
    })
  })

  it('reports errors when toggling the table of contents fails', () => {
    const error = new TestError('toggle failure')
    vi.spyOn($visibility, 'set').mockImplementation(() => {
      throw error
    })

    toggleTableOfContents()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'visibility',
      operation: 'toggleTableOfContents',
    })
  })

  it('reports errors when disabling the table of contents fails', () => {
    const error = new TestError('disable failure')
    vi.spyOn($visibility, 'set').mockImplementation(() => {
      throw error
    })

    disableTableOfContents()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'visibility',
      operation: 'disableTableOfContents',
    })
  })

  it('reports errors when enabling the table of contents fails', () => {
    const error = new TestError('enable failure')
    vi.spyOn($visibility, 'set').mockImplementation(() => {
      throw error
    })

    enableTableOfContents()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'visibility',
      operation: 'enableTableOfContents',
    })
  })
})
