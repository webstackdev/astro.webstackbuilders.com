// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { Window } from 'happy-dom'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ConsentBanner from '@components/Consent/Banner/index.astro'
import {
  getConsentWrapper,
  getConsentCloseBtn,
  getConsentAllowBtn,
  getConsentCustomizeBtn,
} from '@components/Consent/Banner/client/selectors'
import { ClientScriptError } from '@components/scripts/errors'

const attachDom = (html: string): Window => {
  const windowInstance = new Window()
  windowInstance.document.body.innerHTML = html

  globalThis.window = windowInstance as unknown as typeof globalThis.window
  globalThis.document = windowInstance.document as unknown as Document
  globalThis.Node = windowInstance.Node as unknown as typeof globalThis.Node

  return windowInstance
}

describe('Consent Banner Selectors', () => {
  let container: AstroContainer
  let windowInstance: Window

  beforeEach(async () => {
    container = await AstroContainer.create()
    const markup = await container.renderToString(ConsentBanner)
    windowInstance = attachDom(markup)
  })

  afterEach(() => {
    windowInstance.happyDOM?.cancelAsync?.()
    delete (globalThis as { document?: Document }).document
    delete (globalThis as { window?: typeof globalThis.window }).window
    delete (globalThis as { Node?: typeof globalThis.Node }).Node
  })

  it('returns consent modal wrapper with expected attributes', () => {
    const wrapper = getConsentWrapper()

    expect(wrapper.id).toBe('consent-modal-id')
    expect(wrapper.getAttribute('role')).toBe('dialog')
    expect(wrapper.getAttribute('aria-label')).toBe('Cookie consent dialog')
  })

  it('locates the close button', () => {
    const closeBtn = getConsentCloseBtn()

    expect(closeBtn).toBeTruthy()
    expect(closeBtn.classList.contains('consent-modal__close-btn')).toBe(true)
    expect(closeBtn.getAttribute('aria-label')).toMatch(/close cookie consent dialog/i)
  })

  it('locates the allow-all button', () => {
    const allowBtn = getConsentAllowBtn()

    expect(allowBtn).toBeTruthy()
    expect(allowBtn.classList.contains('consent-modal__btn-allow')).toBe(true)
    expect(allowBtn.textContent?.trim()).toBe('Allow All')
  })

  it('locates the customize button', () => {
    const customizeBtn = getConsentCustomizeBtn()

    expect(customizeBtn).toBeTruthy()
    expect(customizeBtn.classList.contains('consent-modal__btn-customize')).toBe(true)
    expect(customizeBtn.textContent?.trim()).toBe('Customize')
  })

  it('throws a ClientScriptError when wrapper is missing', () => {
    document.getElementById('consent-modal-id')?.remove()

    expect(() => getConsentWrapper()).toThrowError(ClientScriptError)
  })
})
