/**
 * State tests for consent modal visibility
 * Now uses centralized state store from Scripts/state
 */
// @vitest-environment happy-dom
import { describe, expect, beforeEach, test } from 'vitest'
import { AppBootstrap } from '@components/scripts/bootstrap'
import {
  showConsentBanner,
  hideConsentBanner,
  toggleConsentBanner,
  isConsentBannerVisible,
} from '@components/Consent/Banner/client/state'

describe(`Cookie modal visibility using state store`, () => {
  beforeEach(() => {
    // Initialize state management before each test
    AppBootstrap.init()
    // Reset modal visibility to default
    hideConsentBanner()
  })

  test(`returns false from state store by default`, () => {
    // State store initializes with false
    expect(isConsentBannerVisible()).toBe(false)
  })

  test(`returns true from state store when set to true`, () => {
    showConsentBanner()
    expect(isConsentBannerVisible()).toBe(true)
  })

  test(`returns false from state store when set to false`, () => {
    showConsentBanner()
    hideConsentBanner()
    expect(isConsentBannerVisible()).toBe(false)
  })

  test(`sets state store value`, () => {
    showConsentBanner()
    expect(isConsentBannerVisible()).toBe(true)
  })

  test(`initializes state store to true`, () => {
    showConsentBanner()
    expect(isConsentBannerVisible()).toBe(true)
  })

  test(`toggleConsentBanner changes visibility state`, () => {
    expect(isConsentBannerVisible()).toBe(false)
    toggleConsentBanner()
    expect(isConsentBannerVisible()).toBe(true)
    toggleConsentBanner()
    expect(isConsentBannerVisible()).toBe(false)
  })
})

