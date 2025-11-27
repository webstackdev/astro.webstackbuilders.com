// @vitest-environment node

import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import ConsentPreferencesComponent from '@components/Consent/Preferences/index.astro'
import type { ConsentPreferencesElement } from '@components/Consent/Preferences/client'
import { getAllowAllBtn, getSavePreferencesBtn, getDenyAllBtn } from '@components/Consent/Preferences/client/selectors'
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

  it('returns the deny-all button', async () => {
    await renderConsentPreferences(() => {
      const denyBtn = getDenyAllBtn()

      expect(denyBtn.id).toBe('consent-deny-all')
      expect(denyBtn.textContent?.trim()).toBe('Decline All')
    })
  })
})
