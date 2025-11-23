// @vitest-environment node

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import CheckboxFixture from '@components/Consent/Checkbox/client/__tests__/checkbox.fixture.astro'
import type { ConsentCheckboxElement } from '@components/Consent/Checkbox/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import { ClientScriptError } from '@components/scripts/errors'
import * as consentStore from '@components/scripts/store'

vi.mock('@components/scripts/store', () => {
  const listeners = new Set<(_value: boolean) => void>()
  let functionalConsent = false

  const emitFunctionalConsent = (value: boolean) => {
    functionalConsent = value
    listeners.forEach((listener) => listener(functionalConsent))
  }

  const subscribeToFunctionalConsent = vi.fn((listener: (_value: boolean) => void) => {
    listeners.add(listener)
    listener(functionalConsent)
    return () => {
      listeners.delete(listener)
    }
  })

  return {
    updateConsent: vi.fn((_category: string, value: boolean) => {
      emitFunctionalConsent(value)
    }),
    subscribeToFunctionalConsent,
    getFunctionalConsentPreference: vi.fn(() => functionalConsent),
    __test: {
      emitFunctionalConsent,
      resetConsent: () => emitFunctionalConsent(false),
    },
  }
})

type ConsentStoreMock = typeof consentStore & {
  __test: {
    emitFunctionalConsent: (_value: boolean) => void
    resetConsent: () => void
  }
}

const consentStoreMock = consentStore as ConsentStoreMock
const updateConsentMock = vi.mocked(consentStore.updateConsent)
const subscribeToFunctionalConsentMock = vi.mocked(consentStore.subscribeToFunctionalConsent)

type ConsentClientModule = typeof import('@components/Consent/Checkbox/client')
let consentClientModule: ConsentClientModule | null = null

const getConsentClientModule = (): ConsentClientModule => {
  if (!consentClientModule) {
    throw new Error('Consent checkbox client module not initialized')
  }

  return consentClientModule
}

type ConsentCheckboxModule = WebComponentModule<ConsentCheckboxElement>

const defaultProps = {
  id: 'gdpr-consent',
  formId: 'contact-form',
  purpose: 'Responding to your inquiry',
}

beforeAll(async () => {
  await withJsdomEnvironment(async () => {
    consentClientModule = await import('@components/Consent/Checkbox/client')
  })
})

const CONSENT_READY_TIMEOUT_MS = 2_000

beforeEach(() => {
  consentStoreMock.__test.resetConsent()
  updateConsentMock.mockClear()
  subscribeToFunctionalConsentMock.mockClear()
})

const waitForConsentReady = async (element: ConsentCheckboxElement) => {
  await new Promise<void>((resolve, reject) => {
    if (element.isInitialized) {
      resolve()
      return
    }

    const timeoutId = setTimeout(() => {
      element.removeEventListener('consent-checkbox:ready', onReady)
      reject(new Error('Consent checkbox never finished initializing'))
    }, CONSENT_READY_TIMEOUT_MS)

    function onReady() {
      clearTimeout(timeoutId)
      resolve()
    }

    element.addEventListener('consent-checkbox:ready', onReady, { once: true })
  })
}

const renderConsentCheckbox = async (
  assertion: (_context: { element: ConsentCheckboxElement; window: any }) => Promise<void> | void,
  props: Record<string, unknown> = {},
) => {
  const container = await AstroContainer.create()

  await executeRender<ConsentCheckboxModule>({
    container,
    component: CheckboxFixture,
    moduleSpecifier: '@components/Consent/Checkbox/client/index',
    args: { props: { ...defaultProps, ...props } },
    selector: 'consent-checkbox',
    waitForReady: waitForConsentReady,
    assert: async ({ element, window }) => assertion({ element, window }),
  })
}

describe('ConsentCheckboxElement', () => {
  it('requests consent updates when the checkbox is checked', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox).toBeTruthy()

      checkbox!.checked = true
      checkbox!.dispatchEvent(new window.Event('change', { bubbles: true }))

      expect(updateConsentMock).toHaveBeenCalledWith('functional', true)
    })
  })

  it('revokes consent when the checkbox is unchecked', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox).toBeTruthy()

      checkbox!.checked = true
      checkbox!.dispatchEvent(new window.Event('change', { bubbles: true }))
      checkbox!.checked = false
      checkbox!.dispatchEvent(new window.Event('change', { bubbles: true }))

      expect(updateConsentMock).toHaveBeenLastCalledWith('functional', false)
    })
  })

  it('pre-checks when functional consent already exists', async () => {
    consentStoreMock.__test.emitFunctionalConsent(true)

    await renderConsentCheckbox(({ element }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox).toBeTruthy()
      expect(checkbox!.checked).toBe(true)
    })
  })

  it('updates when consent changes elsewhere', async () => {
    await renderConsentCheckbox(async ({ element }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox).toBeTruthy()

      consentStoreMock.__test.emitFunctionalConsent(true)
      expect(checkbox!.checked).toBe(true)

      consentStoreMock.__test.emitFunctionalConsent(false)
      expect(checkbox!.checked).toBe(false)
    })
  })

  it('prevents form submission and surfaces an error when unchecked', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const form = element.closest('form') as HTMLFormElement | null
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      const errorElement = element.querySelector<HTMLDivElement>('#gdpr-consent-error')

      expect(form).toBeTruthy()
      expect(checkbox).toBeTruthy()
      expect(errorElement).toBeTruthy()

      const submitEvent = new window.Event('submit', { cancelable: true })
      form!.dispatchEvent(submitEvent)

      expect(submitEvent.defaultPrevented).toBe(true)
      expect(errorElement!.textContent).toContain('You must consent to data processing')
    })
  })

  it('allows form submission when consent is granted', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const form = element.closest('form') as HTMLFormElement | null
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')

      expect(form).toBeTruthy()
      expect(checkbox).toBeTruthy()

      checkbox!.checked = true
      const submitEvent = new window.Event('submit', { cancelable: true })
      form!.dispatchEvent(submitEvent)

      expect(submitEvent.defaultPrevented).toBe(false)
    })
  })

  it('focuses the checkbox when submission is blocked', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const form = element.closest('form') as HTMLFormElement | null
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')

      expect(form).toBeTruthy()
      expect(checkbox).toBeTruthy()

      const focusSpy = vi.spyOn(checkbox as HTMLInputElement, 'focus')
      form!.dispatchEvent(new window.Event('submit', { cancelable: true }))

      expect(focusSpy).toHaveBeenCalled()
    })
  })
})

describe('Validation helpers', () => {
  it('validateConsent shows and clears error messages', async () => {
    const { validateConsent } = getConsentClientModule()

    await renderConsentCheckbox(({ element }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      const errorElement = element.querySelector<HTMLDivElement>('#gdpr-consent-error')

      expect(checkbox).toBeTruthy()
      expect(errorElement).toBeTruthy()

      checkbox!.checked = false
      expect(validateConsent(checkbox!, errorElement!)).toBe(false)
      expect(errorElement!.textContent).toContain('You must consent to data processing')

      checkbox!.checked = true
      expect(validateConsent(checkbox!, errorElement!)).toBe(true)
      expect(errorElement!.textContent).toBe('')
    })
  })

  it('isConsentValid reflects the checkbox state', async () => {
    const { isConsentValid } = getConsentClientModule()

    await renderConsentCheckbox(({ element }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox).toBeTruthy()

      checkbox!.checked = false
      expect(isConsentValid('gdpr-consent')).toBe(false)

      checkbox!.checked = true
      expect(isConsentValid('gdpr-consent')).toBe(true)
    })
  })
})

describe('initGDPRConsent', () => {
  it('throws ClientScriptError when elements are missing', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = '<div></div>'

      const { initGDPRConsent } = getConsentClientModule()
      expect(() => initGDPRConsent('missing', 'contact')).toThrow(ClientScriptError)
    })
  })

  it('handles checkboxes that are not inside a form', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = `
        <div id="gdpr-consent-container">
          <input type="checkbox" id="gdpr-consent" />
          <div id="gdpr-consent-error"></div>
        </div>
      `

      const { initGDPRConsent } = getConsentClientModule()
      const cleanup = initGDPRConsent('gdpr-consent', 'contact')

      const checkbox = window.document.getElementById('gdpr-consent') as HTMLInputElement
      checkbox.checked = true
      checkbox.dispatchEvent(new window.Event('change'))

      expect(updateConsentMock).toHaveBeenCalledWith('functional', true)

      cleanup()
    })
  })
})
