/**
 * Consent Preferences Management
 * Handles consent preference functionality for the inline component
 * Uses centralized state management from scripts/store
 */

import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { isInputElement } from '@components/scripts/assertions/elements'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import {
  getConsentSnapshot,
  subscribeToConsentState,
  updateConsent,
  allowAllConsent,
  revokeAllConsent,
  type ConsentState,
} from '@components/scripts/store'
import { getAllowAllBtn, getSavePreferencesBtn, getDenyAllBtn } from '@components/Consent/Preferences/client/selectors'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'

const COMPONENT_TAG_NAME = 'consent-preferences' as const
const COMPONENT_SCRIPT_NAME = 'ConsentPreferencesElement'
export const CONSENT_PREFERENCES_READY_EVENT = 'consent-preferences:ready'

export class ConsentPreferencesElement extends HTMLElement {
  private allowAllBtn!: HTMLButtonElement
  private denyAllBtn!: HTMLButtonElement
  private saveBtn!: HTMLButtonElement
  private domReadyHandler: (() => void) | null = null
  private beforePreparationHandler: (() => void) | null = null
  private afterSwapHandler: (() => void) | null = null
  private unsubscribeConsent: (() => void) | null = null
  private toggleLabelHandler: ((_event: Event) => void) | null = null
  private isInitialized = false

  connectedCallback(): void {
    if (typeof document === 'undefined' || this.isInitialized) {
      return
    }

    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    try {
      if (document.readyState === 'loading') {
        this.domReadyHandler = () => {
          document.removeEventListener('DOMContentLoaded', this.domReadyHandler as EventListener)
          this.domReadyHandler = null
          this.initialize()
        }
        document.addEventListener('DOMContentLoaded', this.domReadyHandler)
        return
      }

      this.initialize()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  disconnectedCallback(): void {
    if (this.domReadyHandler) {
      document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
      this.domReadyHandler = null
    }

    this.removeViewTransitionsHandlers()
    this.cleanupToggleLabelListeners()

    if (this.unsubscribeConsent) {
      this.unsubscribeConsent()
      this.unsubscribeConsent = null
    }

    this.isInitialized = false
    delete this.dataset['consentPreferencesReady']
  }

  private initialize(): void {
    if (this.isInitialized) {
      return
    }

    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      this.findElements()
      this.bindEvents()
      this.syncConsentState(getConsentSnapshot())
      this.subscribeToConsentStore()
      this.setViewTransitionsHandlers()
      this.isInitialized = true
      this.dispatchReadyEvent()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private dispatchReadyEvent(): void {
    this.dataset['consentPreferencesReady'] = 'true'
    this.dispatchEvent(new CustomEvent(CONSENT_PREFERENCES_READY_EVENT))
  }

  private findElements(): void {
    this.allowAllBtn = getAllowAllBtn()
    this.denyAllBtn = getDenyAllBtn()
    this.saveBtn = getSavePreferencesBtn()
  }

  private subscribeToConsentStore(): void {
    if (this.unsubscribeConsent) {
      return
    }

    const handleUpdate = (consent: ConsentState) => {
      this.syncConsentState(consent)
    }

    this.unsubscribeConsent = subscribeToConsentState(handleUpdate)
  }

  private syncConsentState(consent: ConsentState): void {
    this.updateCheckboxes(consent)
  }

  private setViewTransitionsHandlers(): void {
    if (this.beforePreparationHandler || this.afterSwapHandler) {
      return
    }

    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'setViewTransitionsHandlers' }
    addScriptBreadcrumb(context)

    try {
      this.beforePreparationHandler = () => {
        ConsentPreferencesElement.handleBeforePreparation()
      }

      this.afterSwapHandler = () => {
        this.isInitialized = false
        this.cleanupToggleLabelListeners()
        this.initialize()
      }

      document.addEventListener('astro:before-preparation', this.beforePreparationHandler)
      document.addEventListener('astro:after-swap', this.afterSwapHandler)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private removeViewTransitionsHandlers(): void {
    if (this.beforePreparationHandler) {
      document.removeEventListener('astro:before-preparation', this.beforePreparationHandler)
      this.beforePreparationHandler = null
    }

    if (this.afterSwapHandler) {
      document.removeEventListener('astro:after-swap', this.afterSwapHandler)
      this.afterSwapHandler = null
    }
  }

  private static handleBeforePreparation(): void {
    // Reserved for future cleanup work before View Transition swaps
  }

  private bindEvents(): void {
    addButtonEventListeners(this.allowAllBtn, () => this.allowAll())
    addButtonEventListeners(this.denyAllBtn, () => this.denyAll())
    addButtonEventListeners(this.saveBtn, () => this.savePreferences())
    this.bindToggleLabelListeners()
  }

  private bindToggleLabelListeners(): void {
    if (this.toggleLabelHandler) {
      return
    }

    this.toggleLabelHandler = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }

      const label = target.closest<HTMLLabelElement>('[data-consent-toggle]')
      if (!label || !this.contains(label)) {
        return
      }

      event.preventDefault()
      const checkboxId = label.getAttribute('data-consent-toggle')
      if (!checkboxId) {
        return
      }

      const checkbox = document.getElementById(checkboxId)
      if (isInputElement(checkbox)) {
        checkbox.checked = !checkbox.checked
      }
    }

    document.addEventListener('click', this.toggleLabelHandler)
  }

  private cleanupToggleLabelListeners(): void {
    if (this.toggleLabelHandler) {
      document.removeEventListener('click', this.toggleLabelHandler)
      this.toggleLabelHandler = null
    }
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

    updateConsent('analytics', preferences.analytics ?? false)
    updateConsent('functional', preferences.functional ?? false)
    updateConsent('marketing', preferences.marketing ?? false)

    this.applyPreferences(preferences)
    this.showNotification('Consent preferences saved successfully!')
  }

  private allowAll(): void {
    allowAllConsent()
    const updatedConsent = getConsentSnapshot()
    this.syncConsentState(updatedConsent)
    this.applyPreferences(updatedConsent)
    this.showNotification('All consent enabled!')
  }

  private denyAll(): void {
    revokeAllConsent()
    const updatedConsent = getConsentSnapshot()
    this.syncConsentState(updatedConsent)
    this.applyPreferences(updatedConsent)
    this.showNotification('All optional consent disabled!')
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
    // Placeholder for analytics consent enabling logic
  }

  private disableAnalytics(): void {
    // Placeholder for analytics consent disabling logic
  }

  private enableFunctional(): void {
    // Placeholder for functional consent enabling logic
  }

  private disableFunctional(): void {
    // Placeholder for functional consent disabling logic
  }

  private enableMarketing(): void {
    // Placeholder for marketing consent enabling logic
  }

  private disableMarketing(): void {
    // Placeholder for marketing consent disabling logic
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    document
      .querySelectorAll<HTMLDivElement>('[data-testid="consent-toast"]')
      .forEach((existingToast) => existingToast.remove())

    const typeClasses: Record<'success' | 'error', string> = {
      success: 'bg-green-600',
      error: 'bg-red-600',
    }

    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 ${typeClasses[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`
    notification.dataset['testid'] = 'consent-toast'
    notification.dataset['toastType'] = type
    notification.textContent = message

    document.body.appendChild(notification)

    window.setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translateY(-20px)'
      window.setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'consent-preferences': ConsentPreferencesElement
  }
}

export const registerConsentPreferencesWebComponent = (tagName: string = COMPONENT_TAG_NAME) => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, ConsentPreferencesElement)
}

export const webComponentModule: WebComponentModule<ConsentPreferencesElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: ConsentPreferencesElement,
  registerWebComponent: registerConsentPreferencesWebComponent,
}
