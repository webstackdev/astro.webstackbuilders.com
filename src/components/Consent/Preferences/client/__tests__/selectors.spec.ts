// @vitest-environment node

import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import ConsentPreferencesComponent from '@components/Consent/Preferences/index.astro'
import type { ConsentPreferencesElement } from '@components/Consent/Preferences/client'
import {
  getConsentCustomizeModal,
  getConsentCustomizeCloseBtn,
  getAllowAllBtn,
  getSavePreferencesBtn,
} from '@components/Consent/Preferences/client/selectors'
import { ClientScriptError } from '@components/scripts/errors'
import {
  executeRender,
  withJsdomEnvironment,
} from '@test/unit/helpers/litRuntime'

type ConsentPreferencesModule = WebComponentModule<ConsentPreferencesElement>
type JsdomWindow = Window & typeof globalThis

const CONSENT_READY_TIMEOUT_MS = 2_000
const CONSENT_PREFERENCES_READY_EVENT = 'consent-preferences:ready'

const waitForPreferencesReady = async (element: ConsentPreferencesElement) => {
  if (element.dataset['consentPreferencesReady'] === 'true') {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      element.removeEventListener(CONSENT_PREFERENCES_READY_EVENT, onReady)
      reject(new Error('Consent preferences component never finished initializing'))
    }, CONSENT_READY_TIMEOUT_MS)

    function onReady() {
      clearTimeout(timeoutId)
      resolve()
    }

    element.addEventListener(CONSENT_PREFERENCES_READY_EVENT, onReady, { once: true })
  })
}

const renderConsentPreferences = async (
  assertion: (_context: { element: ConsentPreferencesElement; window: JsdomWindow }) => Promise<void> | void,
) => {
  const container = await AstroContainer.create()

  await executeRender<ConsentPreferencesModule>({
    container,
    component: ConsentPreferencesComponent,
    moduleSpecifier: '@components/Consent/Preferences/client/index',
    selector: 'consent-preferences',
    waitForReady: waitForPreferencesReady,
    assert: async ({ element, window }) => {
      if (!window) {
        throw new Error('Consent preferences tests require a window instance')
      }

      await assertion({ element, window: window as JsdomWindow })
    },
  })
}

beforeEach(async () => {
  await withJsdomEnvironment(({ window }) => {
    window.sessionStorage.clear()
    window.localStorage.clear()
  })
})

describe('Consent Preferences Selectors', () => {
  it('returns the consent customize modal wrapper', async () => {
    await renderConsentPreferences(() => {
      const modal = getConsentCustomizeModal()

      expect(modal.id).toBe('consent-modal-modal-id')
      expect(modal.getAttribute('role')).toBe('dialog')
      expect(modal.getAttribute('aria-label')).toBe('customize consent dialog')
    })
  })

  it('returns the close button with expected attributes', async () => {
    await renderConsentPreferences(() => {
      const closeBtn = getConsentCustomizeCloseBtn()

      expect(closeBtn.classList.contains('consent-modal__close-btn')).toBe(true)
      expect(closeBtn.dataset['testid']).toBe('consent-preferences-close')
      expect(closeBtn.getAttribute('aria-label')).toMatch(/privacy preferences dialog/i)
    })
  })

  it('returns the allow-all button', async () => {
    await renderConsentPreferences(() => {
      const allowBtn = getAllowAllBtn()

      expect(allowBtn.id).toBe('consent-allow-all')
      expect(allowBtn.textContent?.trim()).toBe('Allow All')
    })
  })

  it('returns the save preferences button', async () => {
    await renderConsentPreferences(() => {
      const saveBtn = getSavePreferencesBtn()

      expect(saveBtn.id).toBe('consent-save-preferences')
      expect(saveBtn.textContent?.trim()).toBe('Save My Preferences')
    })
  })

  it('throws ClientScriptError when the modal is missing', async () => {
    await renderConsentPreferences(({ window }) => {
      window.document.getElementById('consent-modal-modal-id')?.remove()

      expect(() => getConsentCustomizeModal()).toThrowError(ClientScriptError)
    })
  })
})
