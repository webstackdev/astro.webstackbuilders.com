// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderConsentCheckbox } from '@components/Consent/Checkbox/client/__tests__/testUtils'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
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

beforeEach(() => {
  consentStoreMock.__test.resetConsent()
  updateConsentMock.mockClear()
  subscribeToFunctionalConsentMock.mockClear()
})

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

  it('continues to operate when the checkbox is not inside a form', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const form = element.closest('form')
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')

      expect(form).toBeNull()
      expect(checkbox).toBeTruthy()

      checkbox!.checked = true
      checkbox!.dispatchEvent(new window.Event('change', { bubbles: true }))

      expect(updateConsentMock).toHaveBeenCalledWith('functional', true)
    }, { wrapInForm: false })
  })
})

describe('ConsentCheckbox web component module contract', () => {
  it('exposes metadata for registration', async () => {
    await withJsdomEnvironment(async () => {
      const { webComponentModule, ConsentCheckboxElement } = await import('@components/Consent/Checkbox/client')
      expect(webComponentModule.registeredName).toBe('consent-checkbox')
      expect(webComponentModule.componentCtor).toBe(ConsentCheckboxElement)
    })
  })

  it('registers the custom element when window is available', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      const { registerConsentCheckboxWebComponent, ConsentCheckboxElement } = await import('@components/Consent/Checkbox/client')
      const uniqueTag = `consent-checkbox-${Math.random().toString(36).slice(2)}`

      const originalGet = window.customElements.get.bind(window.customElements)
      const getSpy = vi.spyOn(window.customElements, 'get').mockImplementation((tagName: string) => {
        if (tagName === uniqueTag) {
          return undefined
        }
        return originalGet(tagName)
      })
      const defineSpy = vi.spyOn(window.customElements, 'define').mockImplementation(() => undefined)

      registerConsentCheckboxWebComponent(uniqueTag)

      expect(defineSpy).toHaveBeenCalledWith(uniqueTag, ConsentCheckboxElement)

      getSpy.mockRestore()
      defineSpy.mockRestore()
    })
  })
})
