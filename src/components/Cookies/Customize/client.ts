/**
 * Cookie Preferences Management using LoadableScript pattern
 * Handles cookie preference functionality and modal interactions
 * Now uses centralized state management from lib/state
 */

import { LoadableScript, type TriggerEvent } from '../../Scripts/loader/@types/loader'
import { isDivElement, isButtonElement } from '@components/Scripts/assertions/elements'
import { ClientScriptError } from '@components/Scripts/errors/ClientScriptError'
import { addButtonEventListeners } from '@components/Scripts/elementListeners'
import { updateConsent, $consent } from '@components/Scripts/store'

export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  functional: boolean
  advertising: boolean
  timestamp: string
}

/**
 * Cookie Preferences component using LoadableScript pattern
 */
export class CookieCustomize extends LoadableScript {
  static override scriptName = 'CookieCustomize'
  static override eventType: TriggerEvent = 'astro:page-load'

  private modal: HTMLDivElement
  private closeBtn: HTMLButtonElement
  private allowAllBtn: HTMLButtonElement | null
  private saveBtn: HTMLButtonElement | null

  constructor() {
    super()
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
      necessary: consent.necessary,
      analytics: consent.analytics,
      functional: consent.functional,
      advertising: consent.advertising,
      timestamp: new Date().toISOString(),
    }

    // Update checkboxes to match current state
    this.updateCheckboxes(preferences)

    return preferences
  }

  private updateCheckboxes(preferences: CookiePreferences): void {
    const analyticsCheckbox = document.getElementById('analytics-cookies') as HTMLInputElement
    const functionalCheckbox = document.getElementById('functional-cookies') as HTMLInputElement
    const advertisingCheckbox = document.getElementById('advertising-cookies') as HTMLInputElement

    if (analyticsCheckbox) analyticsCheckbox.checked = preferences.analytics || false
    if (functionalCheckbox) functionalCheckbox.checked = preferences.functional || false
    if (advertisingCheckbox) advertisingCheckbox.checked = preferences.advertising || false
  }

  savePreferences(): void {
    const preferences = this.getCurrentPreferences()

    // Update state store - automatically updates cookies
    updateConsent('analytics', preferences.analytics)
    updateConsent('functional', preferences.functional)
    updateConsent('advertising', preferences.advertising)

    this.applyPreferences(preferences)

    // Show confirmation
    this.showNotification('Cookie preferences saved successfully!')
  }

  allowAll(): void {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
      advertising: true,
      timestamp: new Date().toISOString(),
    }

    // Update checkboxes
    this.updateCheckboxes(preferences)

    // Update state store - automatically updates cookies
    updateConsent('analytics', true)
    updateConsent('functional', true)
    updateConsent('advertising', true)

    this.applyPreferences(preferences)

    // Show confirmation
    this.showNotification('All cookies enabled!')
  }

  private getCurrentPreferences(): CookiePreferences {
    const analyticsCheckbox = document.getElementById('analytics-cookies') as HTMLInputElement
    const functionalCheckbox = document.getElementById('functional-cookies') as HTMLInputElement
    const advertisingCheckbox = document.getElementById('advertising-cookies') as HTMLInputElement

    return {
      necessary: true, // Always true
      analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
      functional: functionalCheckbox ? functionalCheckbox.checked : false,
      advertising: advertisingCheckbox ? advertisingCheckbox.checked : false,
      timestamp: new Date().toISOString(),
    }
  }

  applyPreferences(preferences: CookiePreferences): void {
    // Apply the cookie preferences to actual cookie management
    // This would integrate with your analytics, functional, and advertising scripts

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

    if (preferences.advertising) {
      this.enableAdvertising()
    } else {
      this.disableAdvertising()
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

  private enableAdvertising(): void {
    // Implement advertising cookie enabling logic
    // Example: Load advertising tracking scripts
  }

  private disableAdvertising(): void {
    // Implement advertising cookie disabling logic
    // Example: Clear advertising cookies
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
  static override init(): void {
    const cookieCustomize = new CookieCustomize()
    cookieCustomize.bindEvents()
    cookieCustomize.loadPreferences()
  }

  static override pause(): void {
    // Cookie preferences don't need pause functionality
  }

  static override resume(): void {
    // Cookie preferences don't need resume functionality
  }

  static override reset(): void {
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
