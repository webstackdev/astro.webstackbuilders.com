// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest'
import {
  hideConsentBanner,
  isConsentBannerVisible,
  showConsentBanner,
  toggleConsentBanner,
} from '@components/scripts/store/visibility'

describe('UI visibility state management', () => {
  beforeEach(() => {
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
