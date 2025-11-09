/**
 * Consent Preferences Management
 * Handles consent preference functionality and modal interactions
 * Uses centralized state management from scripts/store
 */

import { isDivElement, isButtonElement, isInputElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { updateConsent, $consent, type ConsentState } from '@components/scripts/store'

/**
 * Consent Preferences component
 */
export class ConsentCustomize {
  static scriptName = 'ConsentCustomize'

  private modal: HTMLDivElement
  private closeBtn: HTMLButtonElement
  private allowAllBtn: HTMLButtonElement | null
  private saveBtn: HTMLButtonElement | null

  constructor() {
    this.modal = this.getConsentCustomizeModal()
    this.closeBtn = this.getConsentCustomizeCloseBtn()
    this.allowAllBtn = document.getElementById('consent-allow-all') as HTMLButtonElement
    this.saveBtn = document.getElementById('consent-save-preferences') as HTMLButtonElement
  }

  /** Gets the HTMLDivElement wrapping the consent customize modal */
  private getConsentCustomizeModal(): HTMLDivElement {
    const modal = document.getElementById('cookie-customize-modal-id')
    if (!isDivElement(modal)) {
      throw new ClientScriptError(
        `Consent customize modal with id 'cookie-customize-modal-id' not found`
      )
    }
    return modal
  }

  /** Gets the close button for the consent customize modal */
  private getConsentCustomizeCloseBtn(): HTMLButtonElement {
    const closeBtn = document.querySelector('.cookie-modal__close-btn')
    if (!isButtonElement(closeBtn)) {
      throw new ClientScriptError(
        `Consent customize close button with class 'cookie-modal__close-btn' not found`
      )
    }
    return closeBtn
  }

  /** Show the consent customize modal */
  showModal(): void {
    this.modal.style.display = 'flex'
  }

  /** Hide the consent customize modal */
  hideModal = (): void => {
    this.modal.style.display = 'none'
  }

  bindEvents(): void {
    // Close button
    addButtonEventListeners(this.closeBtn, this.hideModal)

    // Allow all button
    if (this.allowAllBtn) {
      addButtonEventListeners(this.allowAllBtn, () => this.allowAll())
    }

    // Save preferences button
    if (this.saveBtn) {
      addButtonEventListeners(this.saveBtn, () => this.savePreferences())
    }
  }

  loadPreferences(): ConsentState | null {
    // Load from centralized state store
    const consent = $consent.get()

    // Update checkboxes to match current state
    this.updateCheckboxes(consent)

    return consent
  }

  private updateCheckboxes(preferences: ConsentState): void {
    const analyticsCheckbox = document.getElementById('analytics-cookies')
    const functionalCheckbox = document.getElementById('functional-cookies')
    const marketingCheckbox = document.getElementById('marketing-cookies')

    if (isInputElement(analyticsCheckbox)) {
      analyticsCheckbox.checked = preferences.analytics || false
    }
    if (isInputElement(functionalCheckbox)) {
      functionalCheckbox.checked = preferences.functional || false
    }
    if (isInputElement(marketingCheckbox)) {
      marketingCheckbox.checked = preferences.marketing || false
    }
  }

  savePreferences(): void {
    const preferences = this.getCurrentPreferences()

    // Update state store - automatically updates cookies
    updateConsent('analytics', preferences.analytics)
    updateConsent('functional', preferences.functional)
    updateConsent('marketing', preferences.marketing)

    this.applyPreferences(preferences)

    // Show confirmation
    this.showNotification('Consent preferences saved successfully!')
  }

  allowAll(): void {
    const preferences: ConsentState = {
      analytics: true,
      functional: true,
      marketing: true,
    }

    // Update checkboxes
    this.updateCheckboxes(preferences)

    // Update state store - automatically updates cookies
    updateConsent('analytics', true)
    updateConsent('functional', true)
    updateConsent('marketing', true)

    this.applyPreferences(preferences)

    // Show confirmation
    this.showNotification('All consent enabled!')
  }

  private getCurrentPreferences(): ConsentState {
    const analyticsCheckbox = document.getElementById('analytics-cookies')
    const functionalCheckbox = document.getElementById('functional-cookies')
    const marketingCheckbox = document.getElementById('marketing-cookies')

    return {
      analytics: isInputElement(analyticsCheckbox) ? analyticsCheckbox.checked : false,
      functional: isInputElement(functionalCheckbox) ? functionalCheckbox.checked : false,
      marketing: isInputElement(marketingCheckbox) ? marketingCheckbox.checked : false,
    }
  }

  applyPreferences(preferences: ConsentState): void {
    // Apply the consent preferences to actual consent management
    // This would integrate with your analytics, functional, and marketing scripts

    if (preferences.analytics) {
      this.enableAnalytics()
    } else {
      this.disableAnalytics()
    }

    if (preferences.functional) {
      this.enableFunctional()
    } else {
      this.disableFunctional()
    }

    if (preferences.marketing) {
      this.enableMarketing()
    } else {
      this.disableMarketing()
    }
  }

  private enableAnalytics(): void {
    // Implement analytics consent enabling logic
    // Example: Load Google Analytics
    // gtag('config', 'GA_MEASUREMENT_ID')
  }

  private disableAnalytics(): void {
    // Implement analytics consent disabling logic
    // Example: Disable Google Analytics
    // window['ga-disable-GA_MEASUREMENT_ID'] = true
  }

  private enableFunctional(): void {
    // Implement functional consent enabling logic
    // Example: Enable theme preferences, language settings, etc.
  }

  private disableFunctional(): void {
    // Implement functional consent disabling logic
  }

  private enableMarketing(): void {
    // Implement marketing consent enabling logic
    // Example: Load marketing tracking scripts
  }

  private disableMarketing(): void {
    // Implement marketing consent disabling logic
    // Example: Clear marketing cookies
  }

  showNotification(message: string): void {
    // Create a simple notification
    const notification = document.createElement('div')
    notification.className =
      'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300'
    notification.textContent = message

    document.body.appendChild(notification)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translateY(-20px)'
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  /**
   * LoadableScript static methods
   */
  static init(): void {
    const consentCustomize = new ConsentCustomize()
    consentCustomize.bindEvents()
    consentCustomize.loadPreferences()
  }

  static pause(): void {
    // Consent preferences don't need pause functionality
  }

  static resume(): void {
    // Consent preferences don't need resume functionality
  }

  static reset(): void {
    // Clean up any global state if needed for View Transitions
  }
}

/**
 * Helper function to show the consent customize modal
 * Used by the ConsentBanner component
 */
export const showConsentCustomizeModal = (): void => {
  const modal = document.getElementById('cookie-customize-modal-id') as HTMLDivElement
  if (modal) {
    modal.style.display = 'flex'
  }
}
