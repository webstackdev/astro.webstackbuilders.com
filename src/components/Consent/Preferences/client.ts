/**
 * Consent Preferences Management
 * Handles consent preference functionality and modal interactions
 * Uses centralized state management from scripts/store
 */

import { LitElement } from 'lit'
import { isInputElement } from '@components/scripts/assertions/elements'
import {
  getConsentCustomizeModal,
  getConsentCustomizeCloseBtn,
  getAllowAllBtn,
  getSavePreferencesBtn,
} from '@components/Consent/Preferences/selectors'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { updateConsent, $consent, type ConsentState } from '@components/scripts/store'

/**
 * Consent Preferences web component
 */
export class ConsentPreferencesElement extends LitElement {
  private modal: HTMLDivElement | null = null
  private closeBtn: HTMLButtonElement | null = null
  private allowAllBtn: HTMLButtonElement | null = null
  private saveBtn: HTMLButtonElement | null = null

  override createRenderRoot() {
    return this
  }

  override connectedCallback() {
    super.connectedCallback()
    this.initialize()
  }

  private initialize(): void {
    this.findElements()
    this.bindEvents()
    this.loadPreferences()
    this.setViewTransitionsHandlers()
  }

  private findElements(): void {
    this.modal = getConsentCustomizeModal()
    this.closeBtn = getConsentCustomizeCloseBtn()
    this.allowAllBtn = getAllowAllBtn()
    this.saveBtn = getSavePreferencesBtn()
  }

  private setViewTransitionsHandlers(): void {
    document.addEventListener('astro:before-preparation', () => {
      ConsentPreferencesElement.handleBeforePreparation()
    })

    document.addEventListener('astro:after-swap', () => {
      this.initialize()
    })
  }

  private static handleBeforePreparation(): void {
    // Clean up before View Transitions swap
  }

  /** Show the consent customize modal */
  showModal(): void {
    if (this.modal) {
      this.modal.style.display = 'flex'
    }
  }

  /** Hide the consent customize modal */
  private hideModal = (): void => {
    if (this.modal) {
      this.modal.style.display = 'none'
    }
  }

  private bindEvents(): void {
    // Close button
    if (this.closeBtn) {
      addButtonEventListeners(this.closeBtn, this.hideModal)
    }

    // Allow all button
    if (this.allowAllBtn) {
      addButtonEventListeners(this.allowAllBtn, () => this.allowAll())
    }

    // Save preferences button
    if (this.saveBtn) {
      addButtonEventListeners(this.saveBtn, () => this.savePreferences())
    }
  }

  private loadPreferences(): ConsentState | null {
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

  private savePreferences(): void {
    const preferences = this.getCurrentPreferences()

    // Update state store - automatically updates cookies
    updateConsent('analytics', preferences.analytics ?? false)
    updateConsent('functional', preferences.functional ?? false)
    updateConsent('marketing', preferences.marketing ?? false)

    this.applyPreferences(preferences)

    // Show confirmation
    this.showNotification('Consent preferences saved successfully!')
  }

  private allowAll(): void {
    // Update checkboxes
    const preferences: Partial<ConsentState> = {
      analytics: true,
      functional: true,
      marketing: true,
    }

    this.updateCheckboxes(preferences as ConsentState)

    // Update state store - automatically updates cookies
    updateConsent('analytics', true)
    updateConsent('functional', true)
    updateConsent('marketing', true)

    this.applyPreferences(preferences as ConsentState)

    // Show confirmation
    this.showNotification('All consent enabled!')
  }

  private getCurrentPreferences(): Partial<ConsentState> {
    const analyticsCheckbox = document.getElementById('analytics-cookies')
    const functionalCheckbox = document.getElementById('functional-cookies')
    const marketingCheckbox = document.getElementById('marketing-cookies')

    return {
      analytics: isInputElement(analyticsCheckbox) ? analyticsCheckbox.checked : false,
      functional: isInputElement(functionalCheckbox) ? functionalCheckbox.checked : false,
      marketing: isInputElement(marketingCheckbox) ? marketingCheckbox.checked : false,
    }
  }

  private applyPreferences(preferences: Partial<ConsentState>): void {
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

  private showNotification(message: string): void {
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
}

/**
 * Helper function to show the consent customize modal
 * Used by the ConsentBanner component
 */
export const showConsentCustomizeModal = (): void => {
  const modal = getConsentCustomizeModal()
  modal.style.display = 'flex'
}

// Register the custom element
customElements.define('consent-preferences', ConsentPreferencesElement)
