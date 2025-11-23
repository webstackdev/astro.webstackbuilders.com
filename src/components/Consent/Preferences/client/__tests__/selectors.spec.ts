// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { Window } from 'happy-dom'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ConsentPreferences from '@components/Consent/Preferences/index.astro'
import {
  getConsentCustomizeModal,
  getConsentCustomizeCloseBtn,
  getAllowAllBtn,
  getSavePreferencesBtn,
} from '@components/Consent/Preferences/client/selectors'
import { ClientScriptError } from '@components/scripts/errors'

const attachDom = (html: string): Window => {
  const windowInstance = new Window()
  windowInstance.document.body.innerHTML = html

  globalThis.window = windowInstance as unknown as typeof globalThis.window
  globalThis.document = windowInstance.document as unknown as Document
  globalThis.Node = windowInstance.Node as unknown as typeof globalThis.Node

  return windowInstance
}

describe('Consent Preferences Selectors', () => {
  let container: AstroContainer
  let windowInstance: Window

  beforeEach(async () => {
    container = await AstroContainer.create()
    const markup = await container.renderToString(ConsentPreferences)
    windowInstance = attachDom(markup)
  })

  afterEach(() => {
    windowInstance.happyDOM?.cancelAsync?.()
    delete (globalThis as { document?: Document }).document
    delete (globalThis as { window?: typeof globalThis.window }).window
    delete (globalThis as { Node?: typeof globalThis.Node }).Node
  })

  it('returns the consent customize modal wrapper', () => {
    const modal = getConsentCustomizeModal()

    expect(modal.id).toBe('consent-modal-modal-id')
    expect(modal.getAttribute('role')).toBe('dialog')
    expect(modal.getAttribute('aria-label')).toBe('customize consent dialog')
  })

  it('returns the close button with expected attributes', () => {
    const closeBtn = getConsentCustomizeCloseBtn()

    expect(closeBtn.classList.contains('consent-modal__close-btn')).toBe(true)
    expect(closeBtn.dataset['testid']).toBe('consent-preferences-close')
    expect(closeBtn.getAttribute('aria-label')).toMatch(/privacy preferences dialog/i)
  })

  it('returns the allow-all button', () => {
    const allowBtn = getAllowAllBtn()

    expect(allowBtn.id).toBe('consent-allow-all')
    expect(allowBtn.textContent?.trim()).toBe('Allow All')
  })

  it('returns the save preferences button', () => {
    const saveBtn = getSavePreferencesBtn()

    expect(saveBtn.id).toBe('consent-save-preferences')
    expect(saveBtn.textContent?.trim()).toBe('Save My Preferences')
  })

  it('throws ClientScriptError when the modal is missing', () => {
    document.getElementById('consent-modal-modal-id')?.remove()

    expect(() => getConsentCustomizeModal()).toThrowError(ClientScriptError)
  })
})
