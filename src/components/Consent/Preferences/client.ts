/**
 * Cookie Preferences Management
 * Handles cookie preference functionality and modal interactions
 * Now uses centralized state management from lib/state
 */

import { isDivElement, isButtonElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { updateConsent, $consent } from '@components/scripts/store'

export interface CookiePreferences {
  analytics: boolean
  functional: boolean
  marketing: boolean
}

/**
 * Cookie Preferences component
 */
export class CookieCustomize {
  static scriptName = 'CookieCustomize'

  private modal: HTMLDivElement
  private closeBtn: HTMLButtonElement
  private allowAllBtn: HTMLButtonElement | null
  private saveBtn: HTMLButtonElement | null

  constructor() {
    this.modal = this.getCookieCustomizeModal()
    this.closeBtn = this.getCookieCustomizeCloseBtn()
    this.allowAllBtn = document.getElementById('cookie-allow-all') as HTMLButtonElement
    this.saveBtn = document.getElementById('cookie-save-preferences') as HTMLButtonElement
  }

  /** Gets the HTMLDivElement wrapping the cookie customize modal */
  private getCookieCustomizeModal(): HTMLDivElement {
    const modal = document.getElementById('cookie-customize-modal-id')
    if (!isDivElement(modal)) {
      throw new ClientScriptError(
        `Cookie customize modal with id 'cookie-customize-modal-id' not found`
      )
    }
    return modal
  }

  /** Gets the close button for the cookie customize modal */
  private getCookieCustomizeCloseBtn(): HTMLButtonElement {
    const closeBtn = document.querySelector('.cookie-modal__close-btn')
    if (!isButtonElement(closeBtn)) {
      throw new ClientScriptError(
        `Cookie customize close button with class 'cookie-modal__close-btn' not found`
      )
    }
    return closeBtn
  }

  /** Show the cookie customize modal */
  showModal(): void {
    this.modal.style.display = 'flex'
  }

  /** Hide the cookie customize modal */
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

  loadPreferences(): CookiePreferences | null {
    // Load from centralized state store
    const consent = $consent.get()

    const preferences: CookiePreferences = {
      analytics: consent.analytics,
      functional: consent.functional,
      marketing: consent.marketing,
    }

    // Update checkboxes to match current state
    this.updateCheckboxes(preferences)

    return preferences
  }

  private updateCheckboxes(preferences: CookiePreferences): void {
    const analyticsCheckbox = document.getElementById('analytics-cookies') as HTMLInputElement
    const functionalCheckbox = document.getElementById('functional-cookies') as HTMLInputElement
    const marketingCheckbox = document.getElementById('marketing-cookies') as HTMLInputElement

    if (analyticsCheckbox) analyticsCheckbox.checked = preferences.analytics || false
    if (functionalCheckbox) functionalCheckbox.checked = preferences.functional || false
    if (marketingCheckbox) marketingCheckbox.checked = preferences.marketing || false
  }

  savePreferences(): void {
    const preferences = this.getCurrentPreferences()

    // Update state store - automatically updates cookies
    updateConsent('analytics', preferences.analytics)
    updateConsent('functional', preferences.functional)
    updateConsent('marketing', preferences.marketing)

    this.applyPreferences(preferences)

    // Show confirmation
    this.showNotification('Cookie preferences saved successfully!')
  }

  allowAll(): void {
    const preferences: CookiePreferences = {
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
    this.showNotification('All cookies enabled!')
  }

  private getCurrentPreferences(): CookiePreferences {
    const analyticsCheckbox = document.getElementById('analytics-cookies') as HTMLInputElement
    const functionalCheckbox = document.getElementById('functional-cookies') as HTMLInputElement
    const marketingCheckbox = document.getElementById('marketing-cookies') as HTMLInputElement

    return {
      analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
      functional: functionalCheckbox ? functionalCheckbox.checked : false,
      marketing: marketingCheckbox ? marketingCheckbox.checked : false,
    }
  }

  applyPreferences(preferences: CookiePreferences): void {
    // Apply the cookie preferences to actual cookie management
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
    // Implement analytics cookie enabling logic
    // Example: Load Google Analytics
    // gtag('config', 'GA_MEASUREMENT_ID')
  }

  private disableAnalytics(): void {
    // Implement analytics cookie disabling logic
    // Example: Disable Google Analytics
    // window['ga-disable-GA_MEASUREMENT_ID'] = true
  }

  private enableFunctional(): void {
    // Implement functional cookie enabling logic
    // Example: Enable theme preferences, language settings, etc.
  }

  private disableFunctional(): void {
    // Implement functional cookie disabling logic
  }

  private enableMarketing(): void {
    // Implement marketing cookie enabling logic
    // Example: Load marketing tracking scripts
  }

  private disableMarketing(): void {
    // Implement marketing cookie disabling logic
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
    const cookieCustomize = new CookieCustomize()
    cookieCustomize.bindEvents()
    cookieCustomize.loadPreferences()
  }

  static pause(): void {
    // Cookie preferences don't need pause functionality
  }

  static resume(): void {
    // Cookie preferences don't need resume functionality
  }

  static reset(): void {
    // Clean up any global state if needed for View Transitions
  }
}

/**
 * Helper function to show the cookie customize modal
 * Used by the CookieConsent component
 */
export const showCookieCustomizeModal = (): void => {
  const modal = document.getElementById('cookie-customize-modal-id') as HTMLDivElement
  if (modal) {
    modal.style.display = 'flex'
  }
}
