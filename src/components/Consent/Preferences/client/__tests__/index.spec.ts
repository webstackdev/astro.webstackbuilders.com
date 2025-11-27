// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import ConsentPreferencesComponent from '@components/Consent/Preferences/index.astro'
import type { ConsentPreferencesElement } from '@components/Consent/Preferences/client'
import type { ConsentCategory, ConsentState } from '@components/scripts/store'
import { allowAllConsent, updateConsent, revokeAllConsent } from '@components/scripts/store'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

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

const consentMockHelpers = vi.hoisted(() => {
  const defaultState: ConsentState = {
    analytics: false,
    functional: false,
    marketing: false,
    DataSubjectId: '00000000-0000-0000-0000-000000000000',
  }

  const state: ConsentState = { ...defaultState }
  const listeners = new Set<(_consent: ConsentState) => void>()

  return {
    state,
    listeners,
    reset() {
      state.analytics = defaultState.analytics
      state.functional = defaultState.functional
      state.marketing = defaultState.marketing
      state.DataSubjectId = defaultState.DataSubjectId
      listeners.clear()
    },
    notify() {
      const snapshot: ConsentState = { ...state }
      listeners.forEach((listener) => listener(snapshot))
    },
  }
})

vi.mock('@components/scripts/store', () => {
  const { state, listeners, notify } = consentMockHelpers

  return {
    __esModule: true,
    getConsentSnapshot: vi.fn(() => ({ ...state })),
    subscribeToConsentState: vi.fn((listener: (_consent: ConsentState) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }),
    updateConsent: vi.fn((category: ConsentCategory, value: boolean) => {
      state[category] = value
      notify()
    }),
    allowAllConsent: vi.fn(() => {
      state.analytics = true
      state.functional = true
      state.marketing = true
      notify()
    }),
    revokeAllConsent: vi.fn(() => {
      state.analytics = false
      state.functional = false
      state.marketing = false
      notify()
    }),
  }
})

describe('ConsentPreferencesElement', () => {
  beforeEach(async () => {
    consentMockHelpers.reset()
    vi.clearAllMocks()

    await withJsdomEnvironment(({ window }) => {
      window.sessionStorage.clear()
      window.localStorage.clear()
    })
  })

  it('grants all consent when Allow All is clicked', async () => {
    await renderConsentPreferences(({ window }) => {
      const allowBtn = window.document.getElementById('consent-allow-all') as HTMLButtonElement | null
      expect(allowBtn).not.toBeNull()

      allowBtn!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

      expect(allowAllConsent).toHaveBeenCalled()
      expect((window.document.getElementById('analytics-cookies') as HTMLInputElement).checked).toBe(true)
      expect((window.document.getElementById('functional-cookies') as HTMLInputElement).checked).toBe(true)
      expect((window.document.getElementById('marketing-cookies') as HTMLInputElement).checked).toBe(true)
    })
  })

  it('revokes all consent when Decline All is clicked', async () => {
    await renderConsentPreferences(({ window }) => {
      const denyBtn = window.document.getElementById('consent-deny-all') as HTMLButtonElement | null
      expect(denyBtn).not.toBeNull()

      denyBtn!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

      expect(revokeAllConsent).toHaveBeenCalled()
      expect((window.document.getElementById('analytics-cookies') as HTMLInputElement).checked).toBe(false)
      expect((window.document.getElementById('functional-cookies') as HTMLInputElement).checked).toBe(false)
      expect((window.document.getElementById('marketing-cookies') as HTMLInputElement).checked).toBe(false)
    })
  })

  it('saves consent preferences when Save button is clicked', async () => {
    await renderConsentPreferences(({ window }) => {
      const analyticsCheckbox = window.document.getElementById('analytics-cookies') as HTMLInputElement | null
      const functionalCheckbox = window.document.getElementById('functional-cookies') as HTMLInputElement | null
      const marketingCheckbox = window.document.getElementById('marketing-cookies') as HTMLInputElement | null
      expect(analyticsCheckbox).not.toBeNull()
      expect(functionalCheckbox).not.toBeNull()
      expect(marketingCheckbox).not.toBeNull()

      analyticsCheckbox!.checked = true
      functionalCheckbox!.checked = false
      marketingCheckbox!.checked = true

      const saveBtn = window.document.getElementById('consent-save-preferences') as HTMLButtonElement | null
      expect(saveBtn).not.toBeNull()

      saveBtn!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

      expect(updateConsent).toHaveBeenCalledWith('analytics', true)
      expect(updateConsent).toHaveBeenCalledWith('functional', false)
      expect(updateConsent).toHaveBeenCalledWith('marketing', true)
    })
  })
})
