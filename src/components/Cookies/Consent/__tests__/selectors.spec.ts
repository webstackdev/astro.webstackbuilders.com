// @vitest-environment happy-dom
/**
 * Tests for CookieConsent selectors using happy-dom for DOM support
 */
import { describe, expect, test } from 'vitest'
import {
  getCookieConsentAllowBtn,
  getCookieConsentAllowLink,
  getCookieConsentCloseBtn,
  getCookieConsentCustomizeBtn,
  getCookieConsentCustomizeLink,
  getCookieConsentWrapper,
} from '../selectors'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import CookieConsentComponent from '../index.astro'

describe('getCookieConsentWrapper selector works', () => {
  test('works with element in DOM', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    expect(() => getCookieConsentWrapper()).not.toThrow()
    const wrapper = getCookieConsentWrapper()
    expect(wrapper.id).toBe('cookie-modal-id')
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = '<div>No cookie modal</div>'
    expect(() => getCookieConsentWrapper()).toThrow(
      `Cookie consent modal wrapper with id 'cookie-modal-id' not found`
    )
  })
})

describe('getCookieConsentCloseBtn selector works', () => {
  test('works with element in DOM', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    expect(() => getCookieConsentCloseBtn()).not.toThrow()
    const closeBtn = getCookieConsentCloseBtn()
    expect(closeBtn.classList.contains('cookie-modal__close-btn')).toBe(true)
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = '<div>No close button</div>'
    expect(() => getCookieConsentCloseBtn()).toThrow(
      `Cookie consent close button with class 'cookie-modal__close-btn' not found`
    )
  })
})

describe('getCookieConsentAllowBtn selector works', () => {
  test('works with element in DOM', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    expect(() => getCookieConsentAllowBtn()).not.toThrow()
    const allowBtn = getCookieConsentAllowBtn()
    expect(allowBtn.classList.contains('cookie-modal__btn-allow')).toBe(true)
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = '<div>No allow button</div>'
    expect(() => getCookieConsentAllowBtn()).toThrow(
      `Cookie consent 'Allow All' button with class 'cookie-modal__btn-allow' not found`
    )
  })
})

describe('getCookieConsentAllowLink selector works', () => {
  test('works with element in DOM', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    expect(() => getCookieConsentAllowLink()).not.toThrow()
    const allowLink = getCookieConsentAllowLink()
    expect(allowLink.classList.contains('cookie-modal__link-allow')).toBe(true)
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = '<div>No allow link</div>'
    expect(() => getCookieConsentAllowLink()).toThrow(
      `Cookie consent 'Allow All' link with class 'cookie-modal__link-allow' not found`
    )
  })
})

describe('getCookieConsentCustomizeBtn selector works', () => {
  test('works with element in DOM', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    expect(() => getCookieConsentCustomizeBtn()).not.toThrow()
    const customizeBtn = getCookieConsentCustomizeBtn()
    expect(customizeBtn.classList.contains('cookie-modal__btn-customize')).toBe(true)
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = '<div>No customize button</div>'
    expect(() => getCookieConsentCustomizeBtn()).toThrow(
      `Cookie consent 'Customize' button with class 'cookie-modal__btn-customize' not found`
    )
  })
})

describe('getCookieConsentCustomizeLink selector works', () => {
  test('works with element in DOM', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(CookieConsentComponent)
    document.body.innerHTML = result
    expect(() => getCookieConsentCustomizeLink()).not.toThrow()
    const customizeLink = getCookieConsentCustomizeLink()
    expect(customizeLink.classList.contains('cookie-modal__link-customize')).toBe(true)
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = '<div>No customize link</div>'
    expect(() => getCookieConsentCustomizeLink()).toThrow(
      `Cookie consent 'Customize' link with class 'cookie-modal__link-customize' not found`
    )
  })
})