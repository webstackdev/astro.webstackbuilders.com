/**
 * Consent Preferences Management
 * Handles consent preference functionality for the inline component
 * Uses centralized state management from scripts/store
 */

import { LitElement } from 'lit'
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
import {
  getAllowAllBtn,
  getSavePreferencesBtn,
  getDenyAllBtn,
} from '@components/Pages/Consent/client/selectors'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'

const COMPONENT_TAG_NAME = 'consent-preferences' as const
const COMPONENT_SCRIPT_NAME = 'ConsentPreferencesElement'
const SAVE_PREFERENCES_DELAY_MS = 350
export const CONSENT_PREFERENCES_READY_EVENT = 'consent-preferences:ready'

export class ConsentPreferencesElement extends LitElement {
  static registeredName = COMPONENT_TAG_NAME

  private static readonly saveButtonDisabledClasses = [
    'bg-secondary',
    'cursor-not-allowed',
    'hover:bg-secondary',
  ]

  private static readonly saveButtonEnabledClasses = ['bg-page-inverse', 'hover:bg-secondary-offset']

  private static readonly saveButtonSavingClasses = [
    'bg-secondary-offset',
    'hover:bg-secondary-offset',
    'cursor-progress',
  ]

  private allowAllBtn!: HTMLButtonElement
  private denyAllBtn!: HTMLButtonElement
  private saveBtn!: HTMLButtonElement
  private unsavedDialog: HTMLDialogElement | null = null
  private unsavedSaveBtn: HTMLButtonElement | null = null
  private unsavedDiscardBtn: HTMLButtonElement | null = null
  private unsavedStayBtn: HTMLButtonElement | null = null
  private pendingNavigationUrl: string | null = null
  private shouldBypassNavigationGuard = false
  private toggleChangeHandler: (() => void) | null = null
  private documentClickHandler: ((_event: MouseEvent) => void) | null = null
  private beforeUnloadHandler: ((_event: BeforeUnloadEvent) => void) | null = null
  private unsavedDialogCancelHandler: ((_event: Event) => void) | null = null
  private domReadyHandler: (() => void) | null = null
  private beforePreparationHandler: (() => void) | null = null
  private afterSwapHandler: (() => void) | null = null
  private unsubscribeConsent: (() => void) | null = null
  private isInitialized = false
  private isSavingPreferences = false

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
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

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.domReadyHandler) {
      document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
      this.domReadyHandler = null
    }

    this.removeViewTransitionsHandlers()
    this.removeUnsavedChangesProtection()
    this.removeUnsavedDialogListeners()

    if (this.unsubscribeConsent) {
      this.unsubscribeConsent()
      this.unsubscribeConsent = null
    }

    this.removePreferenceToggleListeners()

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
    this.findUnsavedDialogElements()
  }

  private findUnsavedDialogElements(): void {
    const dialogElement = document.getElementById('consent-unsaved-dialog')
    this.unsavedDialog =
      dialogElement instanceof HTMLElement && dialogElement.tagName === 'DIALOG'
        ? (dialogElement as unknown as HTMLDialogElement)
        : null

    const saveElement = document.getElementById('consent-unsaved-save')
    this.unsavedSaveBtn = saveElement instanceof HTMLButtonElement ? saveElement : null

    const discardElement = document.getElementById('consent-unsaved-discard')
    this.unsavedDiscardBtn = discardElement instanceof HTMLButtonElement ? discardElement : null

    const stayElement = document.getElementById('consent-unsaved-stay')
    this.unsavedStayBtn = stayElement instanceof HTMLButtonElement ? stayElement : null
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
    this.updateSaveButtonState()
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
    addButtonEventListeners(this.saveBtn, () => {
      void this.savePreferencesWithDelay()
    })

    if (!this.toggleChangeHandler) {
      this.toggleChangeHandler = () => this.updateSaveButtonState()
    }

    this.bindPreferenceToggleListeners()
    this.bindUnsavedDialogListeners()
    this.bindUnsavedChangesProtection()
  }

  private bindUnsavedDialogListeners(): void {
    this.removeUnsavedDialogListeners()

    if (!this.unsavedDialog || !this.unsavedSaveBtn || !this.unsavedDiscardBtn || !this.unsavedStayBtn) {
      return
    }

    addButtonEventListeners(
      this.unsavedSaveBtn,
      async () => {
        const saved = await this.savePreferencesWithDelay()
        if (saved) {
          this.closeUnsavedDialog()
          this.pendingNavigationUrl = null
        }
      },
      this
    )

    addButtonEventListeners(this.unsavedDiscardBtn, () => this.navigateToPendingUrl(), this)

    addButtonEventListeners(
      this.unsavedStayBtn,
      () => {
        this.closeUnsavedDialog()
        this.pendingNavigationUrl = null
      },
      this
    )

    this.unsavedDialogCancelHandler = (event: Event) => {
      event.preventDefault()
      this.closeUnsavedDialog()
      this.pendingNavigationUrl = null
    }

    this.unsavedDialog.addEventListener('cancel', this.unsavedDialogCancelHandler)
  }

  private removeUnsavedDialogListeners(): void {
    if (this.unsavedDialog && this.unsavedDialogCancelHandler) {
      this.unsavedDialog.removeEventListener('cancel', this.unsavedDialogCancelHandler)
    }

    this.unsavedDialogCancelHandler = null
  }

  private bindUnsavedChangesProtection(): void {
    if (!this.documentClickHandler) {
      this.documentClickHandler = (event: MouseEvent) => {
        this.handleNavigationClick(event)
      }
    }

    if (!this.beforeUnloadHandler) {
      this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
        if (this.shouldBypassNavigationGuard || !this.hasUnsavedChanges()) {
          return
        }

        event.preventDefault()
      }
    }

    window.addEventListener('click', this.documentClickHandler, true)
    window.addEventListener('beforeunload', this.beforeUnloadHandler)
  }

  private removeUnsavedChangesProtection(): void {
    if (this.documentClickHandler) {
      window.removeEventListener('click', this.documentClickHandler, true)
      this.documentClickHandler = null
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler)
      this.beforeUnloadHandler = null
    }
  }

  private handleNavigationClick(event: MouseEvent): void {
    if (this.shouldBypassNavigationGuard || !this.hasUnsavedChanges() || event.defaultPrevented) {
      return
    }

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }

    const eventTarget = event.target
    if (!(eventTarget instanceof Element)) {
      return
    }

    const anchor = eventTarget.closest('a[href]')
    if (!(anchor instanceof HTMLAnchorElement)) {
      return
    }

    if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
      return
    }

    const destination = new URL(anchor.href, window.location.href)
    const current = new URL(window.location.href)

    const isSamePageNavigation =
      destination.origin === current.origin &&
      destination.pathname === current.pathname &&
      destination.search === current.search

    if (isSamePageNavigation) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    this.pendingNavigationUrl = destination.toString()
    this.openUnsavedDialog()
  }

  private openUnsavedDialog(): void {
    if (!this.unsavedDialog) {
      return
    }

    if (typeof this.unsavedDialog.showModal === 'function') {
      this.unsavedDialog.showModal()
      return
    }

    this.unsavedDialog.setAttribute('open', '')
  }

  private closeUnsavedDialog(): void {
    if (!this.unsavedDialog) {
      return
    }

    if (typeof this.unsavedDialog.close === 'function') {
      this.unsavedDialog.close()
      return
    }

    this.unsavedDialog.removeAttribute('open')
  }

  private navigateToPendingUrl(): void {
    if (!this.pendingNavigationUrl) {
      this.closeUnsavedDialog()
      return
    }

    const destination = this.pendingNavigationUrl
    this.pendingNavigationUrl = null
    this.closeUnsavedDialog()

    this.shouldBypassNavigationGuard = true
    window.location.assign(destination)
  }

  private bindPreferenceToggleListeners(): void {
    this.removePreferenceToggleListeners()

    const analyticsCheckbox = document.getElementById('analytics-cookies')
    const functionalCheckbox = document.getElementById('functional-cookies')
    const marketingCheckbox = document.getElementById('marketing-cookies')

    if (!this.toggleChangeHandler) {
      return
    }

    if (isInputElement(analyticsCheckbox)) {
      analyticsCheckbox.addEventListener('change', this.toggleChangeHandler)
    }

    if (isInputElement(functionalCheckbox)) {
      functionalCheckbox.addEventListener('change', this.toggleChangeHandler)
    }

    if (isInputElement(marketingCheckbox)) {
      marketingCheckbox.addEventListener('change', this.toggleChangeHandler)
    }
  }

  private removePreferenceToggleListeners(): void {
    const analyticsCheckbox = document.getElementById('analytics-cookies')
    const functionalCheckbox = document.getElementById('functional-cookies')
    const marketingCheckbox = document.getElementById('marketing-cookies')

    if (!this.toggleChangeHandler) {
      return
    }

    if (isInputElement(analyticsCheckbox)) {
      analyticsCheckbox.removeEventListener('change', this.toggleChangeHandler)
    }

    if (isInputElement(functionalCheckbox)) {
      functionalCheckbox.removeEventListener('change', this.toggleChangeHandler)
    }

    if (isInputElement(marketingCheckbox)) {
      marketingCheckbox.removeEventListener('change', this.toggleChangeHandler)
    }
  }

  private updateSaveButtonState(): void {
    const hasUnsavedChanges = this.hasUnsavedChanges()
    const isSaveDisabled = this.isSavingPreferences || !hasUnsavedChanges

    this.saveBtn.disabled = isSaveDisabled
    this.saveBtn.setAttribute('aria-disabled', String(isSaveDisabled))

    if (this.unsavedSaveBtn) {
      this.unsavedSaveBtn.disabled = isSaveDisabled
      this.unsavedSaveBtn.setAttribute('aria-disabled', String(isSaveDisabled))
    }

    const disabledClasses = ConsentPreferencesElement.saveButtonDisabledClasses
    const enabledClasses = ConsentPreferencesElement.saveButtonEnabledClasses
    const savingClasses = ConsentPreferencesElement.saveButtonSavingClasses

    this.saveBtn.classList.remove(...disabledClasses, ...enabledClasses, ...savingClasses)

    if (this.isSavingPreferences) {
      this.saveBtn.classList.add(...savingClasses)
      return
    }

    if (!isSaveDisabled) {
      this.saveBtn.classList.add(...enabledClasses)
      return
    }

    this.saveBtn.classList.add(...disabledClasses)
  }

  private hasUnsavedChanges(): boolean {
    const currentPreferences = this.getCurrentPreferences()
    const savedPreferences = getConsentSnapshot()

    return (
      (currentPreferences.analytics ?? false) !== (savedPreferences.analytics ?? false) ||
      (currentPreferences.functional ?? false) !== (savedPreferences.functional ?? false) ||
      (currentPreferences.marketing ?? false) !== (savedPreferences.marketing ?? false)
    )
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

  private async savePreferencesWithDelay(): Promise<boolean> {
    if (this.saveBtn.disabled || this.isSavingPreferences) {
      return false
    }

    this.isSavingPreferences = true
    this.updateSaveButtonState()

    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, SAVE_PREFERENCES_DELAY_MS)
      })

      const preferences = this.getCurrentPreferences()

      updateConsent('analytics', preferences.analytics ?? false)
      updateConsent('functional', preferences.functional ?? false)
      updateConsent('marketing', preferences.marketing ?? false)

      this.applyPreferences(preferences)
      return true
    } finally {
      this.isSavingPreferences = false
      this.updateSaveButtonState()
    }
  }

  private allowAll(): void {
    allowAllConsent()
    const updatedConsent = getConsentSnapshot()
    this.syncConsentState(updatedConsent)
    this.applyPreferences(updatedConsent)
  }

  private denyAll(): void {
    revokeAllConsent()
    const updatedConsent = getConsentSnapshot()
    this.syncConsentState(updatedConsent)
    this.applyPreferences(updatedConsent)
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

export const registerWebComponent = registerConsentPreferencesWebComponent

export const webComponentModule: WebComponentModule<ConsentPreferencesElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: ConsentPreferencesElement,
  registerWebComponent,
}
