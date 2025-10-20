/**
 * DOM selectors for GDPR Consent component
 */

/**
 * Get the consent checkbox element
 */
export function getConsentCheckbox(containerId?: string): HTMLInputElement {
  const id = containerId || 'gdpr-consent'
  const element = document.getElementById(id)

  if (!element || !(element instanceof HTMLInputElement)) {
    throw new Error(`GDPR consent checkbox not found: #${id}`)
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
    throw new Error(`GDPR consent container not found: #${id}`)
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
    throw new Error(`GDPR consent error element not found: #${id}`)
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
    throw new Error(`GDPR consent description not found: #${id}`)
  }

  return element
}
