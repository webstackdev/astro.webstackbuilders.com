// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestError } from '@test/errors'
import {
  $consentBanner,
  $isConsentBannerVisible,
  __resetConsentBannerForTests,
  getConsentBannerVisibility,
  hideConsentBanner,
  showConsentBanner,
  toggleConsentBanner,
} from '../consentBanner'
import { handleScriptError } from '@components/scripts/errors/handler'

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

vi.mock('../tableOfContents', () => ({
  disableTableOfContents: vi.fn(),
  enableTableOfContents: vi.fn(),
  hideTableOfContents: vi.fn(),
}))

import * as tocVisibility from '../tableOfContents'

const disableTableOfContentsMock = vi.mocked(tocVisibility.disableTableOfContents)
const enableTableOfContentsMock = vi.mocked(tocVisibility.enableTableOfContents)
const hideTableOfContentsMock = vi.mocked(tocVisibility.hideTableOfContents)

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  __resetConsentBannerForTests()
})

describe('Consent banner state management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    __resetConsentBannerForTests()
  })

  it('defaults to a hidden consent banner', () => {
    expect($isConsentBannerVisible.get()).toBe(false)
    expect(getConsentBannerVisibility()).toBe(false)
  })

  it('shows the consent banner when requested', () => {
    showConsentBanner()

    expect(getConsentBannerVisibility()).toBe(true)
    expect(disableTableOfContentsMock).toHaveBeenCalledTimes(1)
    expect(hideTableOfContentsMock).toHaveBeenCalledTimes(1)
  })

  it('hides the consent banner after showing it', () => {
    showConsentBanner()
    hideConsentBanner()

    expect(getConsentBannerVisibility()).toBe(false)
    expect(enableTableOfContentsMock).toHaveBeenCalledTimes(1)
  })

  it('toggles the consent banner visibility state', () => {
    expect(getConsentBannerVisibility()).toBe(false)

    toggleConsentBanner()
    expect(getConsentBannerVisibility()).toBe(true)

    toggleConsentBanner()
    expect(getConsentBannerVisibility()).toBe(false)
  })
})

describe('Consent banner error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports errors when showing the banner fails', () => {
    const error = new TestError('show failure')
    vi.spyOn($consentBanner, 'set').mockImplementation(() => {
      throw error
    })

    showConsentBanner()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'consentBanner',
      operation: 'showConsentBanner',
    })
  })

  it('reports errors when hiding the banner fails', () => {
    const error = new TestError('hide failure')
    vi.spyOn($consentBanner, 'set').mockImplementation(() => {
      throw error
    })

    hideConsentBanner()

    expect(handleScriptError).toHaveBeenCalledWith(error, {
      scriptName: 'consentBanner',
      operation: 'hideConsentBanner',
    })
  })
})
