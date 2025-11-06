/**
 * State tests for cookie consent modal visibility
 * Now uses centralized state store from Scripts/state
 */
// @vitest-environment happy-dom
import { describe, expect, beforeEach, test } from 'vitest'
import { AppBootstrap } from '@components/scripts/bootstrap'
import {
  $isConsentBannerVisible,
  showConsentBanner,
  hideConsentBanner,
  toggleConsentBanner,
} from '@components/Consent/Banner/state'
import { $visibility } from '@components/scripts/store'

describe(`Cookie modal visibility using state store`, () => {
  beforeEach(() => {
    // Initialize state management before each test
    AppBootstrap.init()
    // Reset modal visibility to default
    hideConsentBanner()
  })

  test(`returns false from state store by default`, () => {
    // State store initializes with false
    expect($isConsentBannerVisible.get()).toBe(false)
  })

  test(`returns true from state store when set to true`, () => {
    showConsentBanner()
    expect($isConsentBannerVisible.get()).toBe(true)
  })

  test(`returns false from state store when set to false`, () => {
    showConsentBanner()
    hideConsentBanner()
    expect($isConsentBannerVisible.get()).toBe(false)
  })

  test(`sets state store value`, () => {
    showConsentBanner()
    expect($isConsentBannerVisible.get()).toBe(true)
  })

  test(`initializes state store to true`, () => {
    showConsentBanner()
    expect($isConsentBannerVisible.get()).toBe(true)
  })

  test(`state is managed by centralized store`, () => {
    // Verify we're using the Nanostore computed store
    expect($isConsentBannerVisible.get).toBeDefined()
    expect($visibility.get).toBeDefined()
  })

  test(`toggleConsentBanner changes visibility state`, () => {
    expect($isConsentBannerVisible.get()).toBe(false)
    toggleConsentBanner()
    expect($isConsentBannerVisible.get()).toBe(true)
    toggleConsentBanner()
    expect($isConsentBannerVisible.get()).toBe(false)
  })
})

