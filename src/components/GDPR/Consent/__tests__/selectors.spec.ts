// @vitest-environment happy-dom
/**
 * Tests for GDPR Consent DOM selectors
 */
import { describe, expect, test } from 'vitest'
import {
  getConsentCheckbox,
  getConsentContainer,
  getConsentError,
  getConsentDescription
} from '@components/GDPR/Consent/selectors'

/**
 * Helper to create mock GDPR consent HTML structure
 */
function setupConsentDOM(checkboxId = 'gdpr-consent'): void {
  document.body.innerHTML = `
    <div id="${checkboxId}-container" class="gdpr-consent">
      <label class="gdpr-consent__label">
        <input type="checkbox" id="${checkboxId}" name="gdpr_consent" />
        <span id="${checkboxId}-description" class="gdpr-consent__text">
          I consent to processing...
        </span>
      </label>
      <div id="${checkboxId}-error" class="gdpr-consent__error"></div>
    </div>
  `
}

describe('getConsentCheckbox', () => {
  test('returns checkbox element with default ID', () => {
    setupConsentDOM()
    const checkbox = getConsentCheckbox()

    expect(checkbox).toBeInstanceOf(HTMLInputElement)
    expect(checkbox.id).toBe('gdpr-consent')
    expect(checkbox.type).toBe('checkbox')
  })

  test('returns checkbox element with custom ID', () => {
    setupConsentDOM('custom-consent')
    const checkbox = getConsentCheckbox('custom-consent')

    expect(checkbox).toBeInstanceOf(HTMLInputElement)
    expect(checkbox.id).toBe('custom-consent')
  })

  test('throws error when checkbox not found', () => {
    document.body.innerHTML = '<div></div>'

    expect(() => getConsentCheckbox()).toThrow(
      'GDPR consent checkbox not found: #gdpr-consent'
    )
  })

  test('throws error when element is not an input', () => {
    document.body.innerHTML = '<div id="gdpr-consent"></div>'

    expect(() => getConsentCheckbox()).toThrow(
      'GDPR consent checkbox not found: #gdpr-consent'
    )
  })

  test('throws error with custom ID when not found', () => {
    setupConsentDOM('default')

    expect(() => getConsentCheckbox('missing')).toThrow(
      'GDPR consent checkbox not found: #missing'
    )
  })
})

describe('getConsentContainer', () => {
  test('returns container element with default ID', () => {
    setupConsentDOM()
    const container = getConsentContainer()

    expect(container).toBeInstanceOf(HTMLDivElement)
    expect(container.id).toBe('gdpr-consent-container')
    expect(container.className).toContain('gdpr-consent')
  })

  test('returns container element with custom ID', () => {
    setupConsentDOM('custom-consent')
    const container = getConsentContainer('custom-consent')

    expect(container).toBeInstanceOf(HTMLDivElement)
    expect(container.id).toBe('custom-consent-container')
  })

  test('throws error when container not found', () => {
    document.body.innerHTML = '<div></div>'

    expect(() => getConsentContainer()).toThrow(
      'GDPR consent container not found: #gdpr-consent-container'
    )
  })

  test('throws error when element is not a div', () => {
    document.body.innerHTML = '<span id="gdpr-consent-container"></span>'

    expect(() => getConsentContainer()).toThrow(
      'GDPR consent container not found: #gdpr-consent-container'
    )
  })
})

describe('getConsentError', () => {
  test('returns error element with default ID', () => {
    setupConsentDOM()
    const error = getConsentError()

    expect(error).toBeInstanceOf(HTMLDivElement)
    expect(error.id).toBe('gdpr-consent-error')
    expect(error.className).toContain('gdpr-consent__error')
  })

  test('returns error element with custom ID', () => {
    setupConsentDOM('custom-consent')
    const error = getConsentError('custom-consent')

    expect(error).toBeInstanceOf(HTMLDivElement)
    expect(error.id).toBe('custom-consent-error')
  })

  test('throws error when error element not found', () => {
    document.body.innerHTML = '<div></div>'

    expect(() => getConsentError()).toThrow(
      'GDPR consent error element not found: #gdpr-consent-error'
    )
  })

  test('throws error when element is not a div', () => {
    document.body.innerHTML = '<p id="gdpr-consent-error"></p>'

    expect(() => getConsentError()).toThrow(
      'GDPR consent error element not found: #gdpr-consent-error'
    )
  })
})

describe('getConsentDescription', () => {
  test('returns description element with default ID', () => {
    setupConsentDOM()
    const description = getConsentDescription()

    expect(description).toBeInstanceOf(HTMLSpanElement)
    expect(description.id).toBe('gdpr-consent-description')
    expect(description.textContent).toContain('I consent to processing')
  })

  test('returns description element with custom ID', () => {
    setupConsentDOM('custom-consent')
    const description = getConsentDescription('custom-consent')

    expect(description).toBeInstanceOf(HTMLSpanElement)
    expect(description.id).toBe('custom-consent-description')
  })

  test('throws error when description not found', () => {
    document.body.innerHTML = '<div></div>'

    expect(() => getConsentDescription()).toThrow(
      'GDPR consent description not found: #gdpr-consent-description'
    )
  })

  test('throws error when element is not a span', () => {
    document.body.innerHTML = '<div id="gdpr-consent-description"></div>'

    expect(() => getConsentDescription()).toThrow(
      'GDPR consent description not found: #gdpr-consent-description'
    )
  })
})

describe('selector integration', () => {
  test('all selectors work together with default IDs', () => {
    setupConsentDOM()

    const checkbox = getConsentCheckbox()
    const container = getConsentContainer()
    const error = getConsentError()
    const description = getConsentDescription()

    expect(checkbox.id).toBe('gdpr-consent')
    expect(container.id).toBe('gdpr-consent-container')
    expect(error.id).toBe('gdpr-consent-error')
    expect(description.id).toBe('gdpr-consent-description')
  })

  test('all selectors work together with custom IDs', () => {
    setupConsentDOM('newsletter-consent')

    const checkbox = getConsentCheckbox('newsletter-consent')
    const container = getConsentContainer('newsletter-consent')
    const error = getConsentError('newsletter-consent')
    const description = getConsentDescription('newsletter-consent')

    expect(checkbox.id).toBe('newsletter-consent')
    expect(container.id).toBe('newsletter-consent-container')
    expect(error.id).toBe('newsletter-consent-error')
    expect(description.id).toBe('newsletter-consent-description')
  })

  test('checkbox is within container', () => {
    setupConsentDOM()

    const checkbox = getConsentCheckbox()
    const container = getConsentContainer()

    expect(container.contains(checkbox)).toBe(true)
  })

  test('error element is within container', () => {
    setupConsentDOM()

    const error = getConsentError()
    const container = getConsentContainer()

    expect(container.contains(error)).toBe(true)
  })

  test('description is within container', () => {
    setupConsentDOM()

    const description = getConsentDescription()
    const container = getConsentContainer()

    expect(container.contains(description)).toBe(true)
  })
})

describe('edge cases', () => {
  test('handles multiple consent components on page', () => {
    document.body.innerHTML = `
      <div id="gdpr-consent-container">
        <input type="checkbox" id="gdpr-consent" />
        <span id="gdpr-consent-description"></span>
        <div id="gdpr-consent-error"></div>
      </div>
      <div id="newsletter-consent-container">
        <input type="checkbox" id="newsletter-consent" />
        <span id="newsletter-consent-description"></span>
        <div id="newsletter-consent-error"></div>
      </div>
    `

    const gdprCheckbox = getConsentCheckbox('gdpr-consent')
    const newsletterCheckbox = getConsentCheckbox('newsletter-consent')

    expect(gdprCheckbox.id).toBe('gdpr-consent')
    expect(newsletterCheckbox.id).toBe('newsletter-consent')
  })

  test('handles IDs with special characters', () => {
    const specialId = 'form-123_consent'
    document.body.innerHTML = `
      <div id="${specialId}-container">
        <input type="checkbox" id="${specialId}" />
        <span id="${specialId}-description"></span>
        <div id="${specialId}-error"></div>
      </div>
    `

    const checkbox = getConsentCheckbox(specialId)
    expect(checkbox.id).toBe(specialId)
  })
})
