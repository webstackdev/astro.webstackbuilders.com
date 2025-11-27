// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestError } from '@test/errors'
import {
  $visibility,
  hideConsentBanner,
  isConsentBannerVisible,
  showConsentBanner,
  toggleConsentBanner,
} from '@components/scripts/store/visibility'
import { handleScriptError } from '@components/scripts/errors/handler'

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('UI visibility state management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    hideConsentBanner()
  })

  it('defaults to a hidden consent banner', () => {
    expect(isConsentBannerVisible()).toBe(false)
  })

  it('shows the consent banner when requested', () => {
    showConsentBanner()

    expect(isConsentBannerVisible()).toBe(true)
  })

  it('hides the consent banner after showing it', () => {
    showConsentBanner()
    hideConsentBanner()

    expect(isConsentBannerVisible()).toBe(false)
  })

  it('toggles the consent banner visibility state', () => {
    expect(isConsentBannerVisible()).toBe(false)

    toggleConsentBanner()
    expect(isConsentBannerVisible()).toBe(true)

    toggleConsentBanner()
    expect(isConsentBannerVisible()).toBe(false)
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

    showConsentBanner()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'visibility',
      operation: 'showConsentBanner',
    })
  })

  it('reports errors when hiding the banner fails', () => {
    const error = new TestError('hide failure')
    vi.spyOn($visibility, 'set').mockImplementation(() => {
      throw error
    })

    hideConsentBanner()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'visibility',
      operation: 'hideConsentBanner',
    })
  })

  it('reports errors when toggling the banner fails', () => {
    const error = new TestError('toggle failure')
    vi.spyOn($visibility, 'set').mockImplementation(() => {
      throw error
    })

    toggleConsentBanner()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'visibility',
      operation: 'toggleConsentBanner',
    })
  })
})
