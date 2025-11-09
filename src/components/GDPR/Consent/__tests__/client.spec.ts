// @vitest-environment happy-dom
/**
 * Tests for GDPR Consent client-side logic
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  initGDPRConsent,
  validateConsent,
  isConsentValid
} from '@components/GDPR/Consent/client'
import { $formConsent, clearFormConsent, type ConsentPurpose } from '@components/GDPR/Consent/state'
import { isInputElement, isDivElement } from '@components/scripts/assertions/elements'

/**
 * Helper to create mock GDPR consent HTML structure in a form
 */
function setupConsentForm(checkboxId = 'gdpr-consent'): HTMLFormElement {
  const form = document.createElement('form')
  form.innerHTML = `
    <div id="${checkboxId}-container" class="gdpr-consent">
      <label class="gdpr-consent__label">
        <input type="checkbox" id="${checkboxId}" name="gdpr_consent" />
        <span id="${checkboxId}-description" class="gdpr-consent__text">
          I consent to processing...
        </span>
      </label>
      <div id="${checkboxId}-error" class="gdpr-consent__error"></div>
    </div>
    <button type="submit">Submit</button>
  `
  document.body.appendChild(form)
  return form
}

/**
 * Helper to get and validate GDPR consent form elements
 */
function getConsentElements(checkboxId = 'gdpr-consent') {
  const checkbox = document.getElementById(checkboxId)
  if (!isInputElement(checkbox)) {
    throw new Error(`Checkbox with id "${checkboxId}" not found`)
  }

  const errorElement = document.getElementById(`${checkboxId}-error`)
  if (!isDivElement(errorElement)) {
    throw new Error(`Error element with id "${checkboxId}-error" not found`)
  }

  return { checkbox, errorElement }
}

describe('initGDPRConsent', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    clearFormConsent()
  })

  test('initializes checkbox change handler', () => {
    setupConsentForm()
    const purposes: ConsentPurpose[] = ['contact']

    initGDPRConsent('gdpr-consent', purposes)

    const { checkbox } = getConsentElements()
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    const consent = $formConsent.get()
    expect(consent?.purposes).toEqual(['contact'])
    expect(consent?.validated).toBe(true)
  })

  test('records consent when checkbox is checked', () => {
    setupConsentForm()
    const purposes: ConsentPurpose[] = ['contact', 'marketing']

    initGDPRConsent('gdpr-consent', purposes)

    const { checkbox } = getConsentElements()
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    const consent = $formConsent.get()
    expect(consent?.purposes).toEqual(['contact', 'marketing'])
  })

  test('clears consent when checkbox is unchecked', () => {
    setupConsentForm()

    initGDPRConsent('gdpr-consent', ['contact'])

    const { checkbox } = getConsentElements()

    // Check then uncheck
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))
    expect($formConsent.get()).not.toBeNull()

    checkbox.checked = false
    checkbox.dispatchEvent(new Event('change'))
    expect($formConsent.get()).toBeNull()
  })

  test('clears error message when checkbox is checked', () => {
    setupConsentForm()

    initGDPRConsent('gdpr-consent', ['contact'])

    const { checkbox, errorElement } = getConsentElements()

    // Show error first
    errorElement.textContent = 'You must consent'
    errorElement.style.display = 'block'

    // Check checkbox
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    expect(errorElement.textContent).toBe('')
    expect(errorElement.style.display).toBe('none')
  })

  test('includes formId when provided', () => {
    setupConsentForm()

    initGDPRConsent('gdpr-consent', ['contact'], 'contact-form')

    const { checkbox } = getConsentElements('gdpr-consent')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    const consent = $formConsent.get()
    expect(consent?.formId).toBe('contact-form')
  })

  test('works with custom checkbox ID', () => {
    setupConsentForm('custom-consent')

    initGDPRConsent('custom-consent', ['marketing'])

    const { checkbox } = getConsentElements('custom-consent')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    const consent = $formConsent.get()
    expect(consent?.purposes).toEqual(['marketing'])
  })

  test('prevents form submission when unchecked', () => {
    const form = setupConsentForm()

    initGDPRConsent('gdpr-consent', ['contact'])

    const submitEvent = new Event('submit', { cancelable: true })
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')

    form.dispatchEvent(submitEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  test('allows form submission when checked', () => {
    const form = setupConsentForm()

    initGDPRConsent('gdpr-consent', ['contact'])

    const { checkbox } = getConsentElements('gdpr-consent')
    checkbox.checked = true

    const submitEvent = new Event('submit', { cancelable: true })
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')

    form.dispatchEvent(submitEvent)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  test('focuses checkbox when form submission fails', () => {
    const form = setupConsentForm()

    initGDPRConsent('gdpr-consent', ['contact'])

    const { checkbox } = getConsentElements('gdpr-consent')
    const focusSpy = vi.spyOn(checkbox, 'focus')

    form.dispatchEvent(new Event('submit', { cancelable: true }))

    expect(focusSpy).toHaveBeenCalled()
  })

  test('throws error for missing checkbox', () => {
    document.body.innerHTML = '<div></div>'

    // GDPR is a critical component (Phase 1), should throw
    expect(() => initGDPRConsent('missing', ['contact'])).toThrow('GDPR consent checkbox not found')
  })

  test('works without form element', () => {
    // Checkbox not in a form
    document.body.innerHTML = `
      <div id="gdpr-consent-container">
        <input type="checkbox" id="gdpr-consent" />
        <div id="gdpr-consent-error"></div>
      </div>
    `

    initGDPRConsent('gdpr-consent', ['contact'])

    const { checkbox } = getConsentElements('gdpr-consent')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    const consent = $formConsent.get()
    expect(consent?.purposes).toEqual(['contact'])
  })
})

describe('validateConsent', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('returns true when checkbox is checked', () => {
    setupConsentForm()

    const { checkbox } = getConsentElements('gdpr-consent')
    const { errorElement } = getConsentElements()

    checkbox.checked = true
    const result = validateConsent(checkbox, errorElement)

    expect(result).toBe(true)
  })

  test('returns false when checkbox is unchecked', () => {
    setupConsentForm()

    const { checkbox } = getConsentElements('gdpr-consent')
    const { errorElement } = getConsentElements()

    checkbox.checked = false
    const result = validateConsent(checkbox, errorElement)

    expect(result).toBe(false)
  })

  test('shows error message when validation fails', () => {
    setupConsentForm()

    const { checkbox } = getConsentElements('gdpr-consent')
    const { errorElement } = getConsentElements()

    checkbox.checked = false
    validateConsent(checkbox, errorElement)

    expect(errorElement.textContent).toBe('You must consent to data processing to submit this form.')
    expect(errorElement.style.display).toBe('block')
    expect(errorElement.getAttribute('role')).toBe('alert')
  })

  test('clears error message when validation succeeds', () => {
    setupConsentForm()

    const { checkbox } = getConsentElements('gdpr-consent')
    const { errorElement } = getConsentElements()

    // Set error first
    errorElement.textContent = 'Error message'
    errorElement.style.display = 'block'

    checkbox.checked = true
    validateConsent(checkbox, errorElement)

    expect(errorElement.textContent).toBe('')
    expect(errorElement.style.display).toBe('none')
  })

  test('removes role attribute when clearing error', () => {
    setupConsentForm()

    const { checkbox } = getConsentElements('gdpr-consent')
    const { errorElement } = getConsentElements()

    errorElement.setAttribute('role', 'alert')

    checkbox.checked = true
    validateConsent(checkbox, errorElement)

    expect(errorElement.hasAttribute('role')).toBe(false)
  })
})

describe('isConsentValid', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('returns true when checkbox is checked', () => {
    setupConsentForm()

    const { checkbox } = getConsentElements('gdpr-consent')
    checkbox.checked = true

    expect(isConsentValid('gdpr-consent')).toBe(true)
  })

  test('returns false when checkbox is unchecked', () => {
    setupConsentForm()

    const { checkbox } = getConsentElements('gdpr-consent')
    checkbox.checked = false

    expect(isConsentValid('gdpr-consent')).toBe(false)
  })

  test('returns false when checkbox not found', () => {
    document.body.innerHTML = '<div></div>'

    expect(isConsentValid('missing')).toBe(false)
  })

  test('works with custom checkbox ID', () => {
    setupConsentForm('custom-consent')

    const { checkbox } = getConsentElements('custom-consent')
    checkbox.checked = true

    expect(isConsentValid('custom-consent')).toBe(true)
  })
})

describe('integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    clearFormConsent()
  })

  test('complete consent flow: check, submit, validate', () => {
    const form = setupConsentForm()

    initGDPRConsent('gdpr-consent', ['contact'], 'contact-form')

    // Step 1: Check checkbox
    const { checkbox } = getConsentElements('gdpr-consent')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    // Verify consent recorded
    expect($formConsent.get()?.purposes).toEqual(['contact'])

    // Step 2: Submit form
    const submitEvent = new Event('submit', { cancelable: true })
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')
    form.dispatchEvent(submitEvent)

    // Verify submission allowed
    expect(preventDefaultSpy).not.toHaveBeenCalled()

    // Step 3: Validate
    expect(isConsentValid('gdpr-consent')).toBe(true)
  })

  test('complete flow: uncheck after check, submit blocked', () => {
    const form = setupConsentForm()

    initGDPRConsent('gdpr-consent', ['contact'])

    const { checkbox } = getConsentElements('gdpr-consent')

    // Check then uncheck
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))
    checkbox.checked = false
    checkbox.dispatchEvent(new Event('change'))

    // Verify consent cleared
    expect($formConsent.get()).toBeNull()

    // Submit should be blocked
    const submitEvent = new Event('submit', { cancelable: true })
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')
    form.dispatchEvent(submitEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  test('multiple purposes flow', () => {
    setupConsentForm()

    const purposes: ConsentPurpose[] = ['contact', 'marketing', 'analytics']
    initGDPRConsent('gdpr-consent', purposes, 'multi-form')

    const { checkbox } = getConsentElements('gdpr-consent')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    const consent = $formConsent.get()
    expect(consent?.purposes).toEqual(['contact', 'marketing', 'analytics'])
    expect(consent?.formId).toBe('multi-form')
    expect(consent?.validated).toBe(true)
  })
})
