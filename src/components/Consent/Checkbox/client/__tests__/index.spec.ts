
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
  it('wires a stable accessible name via aria-labelledby', async () => {
    await renderConsentCheckbox(({ element }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()

      const labelId = checkbox!.getAttribute('aria-labelledby')
      expect(labelId, 'Consent checkbox should reference its label via aria-labelledby').toBe('gdpr-consent-label')

      const label = element.querySelector<HTMLElement>(`#${labelId}`)
      expect(label, 'Consent checkbox label element should exist').toBeTruthy()
      expect(label!.textContent, 'Consent checkbox label text should be present').toContain('Consent to data processing')
    })
  })

  it('requests consent updates when the checkbox is checked', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()

      checkbox!.checked = true
      checkbox!.dispatchEvent(new window.Event('change', { bubbles: true }))

      expect(updateConsentMock, 'Checking the box should update functional consent').toHaveBeenCalledWith(
        'functional',
        true,
      )
    })
  })

  it('revokes consent when the checkbox is unchecked', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()

      checkbox!.checked = true
      checkbox!.dispatchEvent(new window.Event('change', { bubbles: true }))
      checkbox!.checked = false
      checkbox!.dispatchEvent(new window.Event('change', { bubbles: true }))

      expect(updateConsentMock, 'Unchecking the box should revoke functional consent').toHaveBeenLastCalledWith(
        'functional',
        false,
      )
    })
  })

  it('pre-checks when functional consent already exists', async () => {
    consentStoreMock.__test.emitFunctionalConsent(true)

    await renderConsentCheckbox(({ element }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()
      expect(checkbox!.checked, 'Consent checkbox should pre-check when functional consent is true').toBe(true)
    })
  })

  it('updates when consent changes elsewhere', async () => {
    await renderConsentCheckbox(async ({ element }) => {
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()

      consentStoreMock.__test.emitFunctionalConsent(true)
      expect(checkbox!.checked, 'Consent checkbox should reflect external consent=true').toBe(true)

      consentStoreMock.__test.emitFunctionalConsent(false)
      expect(checkbox!.checked, 'Consent checkbox should reflect external consent=false').toBe(false)
    })
  })

  it('prevents form submission and surfaces an error when unchecked', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const form = element.closest('form') as HTMLFormElement | null
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')
      const errorElement = element.querySelector<HTMLDivElement>('#gdpr-consent-error')

      expect(form, 'Fixture should render the consent checkbox inside a form').toBeTruthy()
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()
      expect(errorElement, 'Consent checkbox error element should exist').toBeTruthy()

      const submitEvent = new window.Event('submit', { cancelable: true })
      form!.dispatchEvent(submitEvent)

      expect(submitEvent.defaultPrevented, 'Submit should be blocked when consent is missing').toBe(true)
      expect(errorElement!.textContent, 'Error message should mention missing consent').toContain(
        'You must consent to data processing',
      )
      expect(checkbox!.getAttribute('aria-invalid'), 'aria-invalid should be set when submission is blocked').toBe(
        'true',
      )
    })
  })

  it('allows form submission when consent is granted', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const form = element.closest('form') as HTMLFormElement | null
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')

      expect(form, 'Fixture should render the consent checkbox inside a form').toBeTruthy()
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()

      checkbox!.checked = true
      const submitEvent = new window.Event('submit', { cancelable: true })
      form!.dispatchEvent(submitEvent)

      expect(submitEvent.defaultPrevented, 'Submit should not be blocked when consent is granted').toBe(false)
    })
  })

  it('clears aria-invalid when consent is granted after an error', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const form = element.closest('form') as HTMLFormElement | null
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')

      expect(form, 'Fixture should render the consent checkbox inside a form').toBeTruthy()
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()

      const submitEvent = new window.Event('submit', { cancelable: true })
      form!.dispatchEvent(submitEvent)
      expect(checkbox!.getAttribute('aria-invalid'), 'aria-invalid should be true after blocked submit').toBe('true')

      checkbox!.checked = true
      checkbox!.dispatchEvent(new window.Event('change', { bubbles: true }))

      expect(checkbox!.getAttribute('aria-invalid'), 'aria-invalid should clear after user grants consent').toBe(
        'false',
      )
    })
  })

  it('focuses the checkbox when submission is blocked', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const form = element.closest('form') as HTMLFormElement | null
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')

      expect(form, 'Fixture should render the consent checkbox inside a form').toBeTruthy()
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()

      const focusSpy = vi.spyOn(checkbox as HTMLInputElement, 'focus')
      form!.dispatchEvent(new window.Event('submit', { cancelable: true }))

      expect(focusSpy, 'Blocked submit should move focus to the checkbox').toHaveBeenCalled()
    })
  })

  it('continues to operate when the checkbox is not inside a form', async () => {
    await renderConsentCheckbox(({ element, window }) => {
      const form = element.closest('form')
      const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')

      expect(form, 'Fixture should not wrap the component in a form').toBeNull()
      expect(checkbox, 'Consent checkbox input should exist').toBeTruthy()

      checkbox!.checked = true
      checkbox!.dispatchEvent(new window.Event('change', { bubbles: true }))

      expect(updateConsentMock, 'Checking the box should update consent even outside a form').toHaveBeenCalledWith(
        'functional',
        true,
      )
    }, { wrapInForm: false })
  })
})

describe('ConsentCheckbox web component module contract', () => {
  it('exposes metadata for registration', async () => {
    await withJsdomEnvironment(async () => {
      const { webComponentModule, ConsentCheckboxElement } = await import('@components/Consent/Checkbox/client')
      expect(webComponentModule.registeredName, 'Module should export the registered tag name').toBe(
        'consent-checkbox',
      )
      expect(webComponentModule.componentCtor, 'Module should export the element constructor').toBe(
        ConsentCheckboxElement,
      )
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

      expect(defineSpy, 'Registration should define the custom element tag').toHaveBeenCalledWith(
        uniqueTag,
        ConsentCheckboxElement,
      )

      getSpy.mockRestore()
      defineSpy.mockRestore()
    })
  })
})
