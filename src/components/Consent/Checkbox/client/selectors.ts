/**
 * DOM selectors for GDPR Consent component
 */
import { ClientScriptError } from '@components/scripts/errors'

const CHECKBOX_SELECTOR = 'input[type="checkbox"]'

/**
 * Get the consent checkbox input element within a consent-checkbox component.
 */
export function getConsentCheckboxInput(scope: ParentNode): HTMLInputElement {
  const checkbox = scope.querySelector(CHECKBOX_SELECTOR)
  if (!checkbox || !(checkbox instanceof HTMLInputElement)) {
    throw new ClientScriptError({
      message: 'Consent checkbox input not found inside component',
    })
  }
  return checkbox
}

/**
 * Get the consent checkbox error element within a consent-checkbox component.
 */
export function getConsentCheckboxErrorElement(
  scope: ParentNode,
  checkboxId: string
): HTMLDivElement {
  const errorElement = scope.querySelector(`#${checkboxId}-error`)
  if (!errorElement || !(errorElement instanceof HTMLDivElement)) {
    throw new ClientScriptError({
      message: 'Consent checkbox error element not found inside component',
    })
  }
  return errorElement
}

/**
 * Query the consent checkbox container element within a consent-checkbox component.
 * Returns null when not present.
 */
export function queryConsentCheckboxContainer(
  scope: ParentNode,
  checkboxId: string
): HTMLDivElement | null {
  const container = scope.querySelector(`#${checkboxId}-container`)
  return container instanceof HTMLDivElement ? container : null
}

/**
 * Query the hidden consent input within a consent-checkbox component.
 * Returns null when not present.
 */
export function queryConsentCheckboxHiddenConsentInput(
  scope: ParentNode,
  checkboxId: string
): HTMLInputElement | null {
  const hiddenConsentInput = scope.querySelector(`#${checkboxId}-hidden`)
  return hiddenConsentInput instanceof HTMLInputElement ? hiddenConsentInput : null
}

/**
 * Query the DataSubjectId hidden input within a consent-checkbox component.
 * Returns null when not present.
 */
export function queryConsentCheckboxDataSubjectIdInput(
  scope: ParentNode,
  checkboxId: string
): HTMLInputElement | null {
  const dataSubjectIdInput = scope.querySelector(`#${checkboxId}-data-subject-id`)
  return dataSubjectIdInput instanceof HTMLInputElement ? dataSubjectIdInput : null
}

/**
 * Query purpose from a descendant node that carries [data-purpose].
 * Returns null when not present.
 */
export function queryConsentCheckboxPurposeData(scope: ParentNode): string | null {
  const dataSource = scope.querySelector<HTMLElement>('[data-purpose]')
  return dataSource?.dataset['purpose'] ?? null
}

/**
 * Query formId from a descendant node that carries [data-form-id].
 * Returns null when not present.
 */
export function queryConsentCheckboxFormIdData(scope: ParentNode): string | null {
  const dataSource = scope.querySelector<HTMLElement>('[data-form-id]')
  return dataSource?.dataset['formId'] ?? null
}

/**
 * Get the consent checkbox element
 */
export function getConsentCheckbox(containerId?: string): HTMLInputElement {
  const id = containerId || 'gdpr-consent'
  const element = document.getElementById(id)

  if (!element || !(element instanceof HTMLInputElement)) {
    throw new ClientScriptError({
      message: `GDPR consent checkbox not found: #${id}`,
    })
  }

  return element
}

/**
 * Get the consent container element
 */
export function getConsentContainer(containerId?: string): HTMLDivElement {
  const id = containerId ? `${containerId}-container` : 'gdpr-consent-container'
  const element = document.getElementById(id)

  if (!element || !(element instanceof HTMLDivElement)) {
    throw new ClientScriptError({
      message: `GDPR consent container not found: #${id}`,
    })
  }

  return element
}

/**
 * Get the consent error message element
 */
export function getConsentError(containerId?: string): HTMLDivElement {
  const id = containerId ? `${containerId}-error` : 'gdpr-consent-error'
  const element = document.getElementById(id)

  if (!element || !(element instanceof HTMLDivElement)) {
    throw new ClientScriptError({
      message: `GDPR consent error element not found: #${id}`,
    })
  }

  return element
}

/**
 * Get the consent description element
 */
export function getConsentDescription(containerId?: string): HTMLSpanElement {
  const id = containerId ? `${containerId}-description` : 'gdpr-consent-description'
  const element = document.getElementById(id)

  if (!element || !(element instanceof HTMLSpanElement)) {
    throw new ClientScriptError({
      message: `GDPR consent description not found: #${id}`,
    })
  }

  return element
}
