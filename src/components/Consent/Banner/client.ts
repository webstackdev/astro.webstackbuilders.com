/**
 * Consent Banner Web Component (Lit-based)
 * Manages the consent modal display and user interactions across View Transitions
 * Uses Light DOM (no Shadow DOM) with Astro-rendered templates
 */

import { LitElement } from 'lit'
import {
  addButtonEventListeners,
  addWrapperEventListeners,
} from '@components/scripts/elementListeners'
import { showConsentBanner, hideConsentBanner } from '@components/Consent/Banner/state'
import { initConsentCookies, allowAllConsentCookies } from '@components/Consent/Banner/cookies'
import { showConsentCustomizeModal } from '@components/Consent/Preferences/client'
import {
  getConsentAllowBtn,
  getConsentCloseBtn,
  getConsentCustomizeBtn,
  getConsentWrapper,
} from '@components/Consent/Banner/selectors'
import { handleScriptError, addScriptBreadcrumb } from '@components/scripts/errors'

/**
 * Consent Banner Custom Element
 * Uses Light DOM instead of Shadow DOM to work with Astro templates
 */
export class ConsentBannerElement extends LitElement {
  // Render to Light DOM instead of Shadow DOM
  override createRenderRoot() {
    return this // No shadow DOM - works with Astro templates!
  }

  // Cache DOM elements
  private wrapper!: HTMLDivElement
  private closeBtn!: HTMLButtonElement
  private allowBtn!: HTMLButtonElement
  private customizeBtn!: HTMLButtonElement

  // Focus trap handler reference for proper cleanup
  private trapFocusHandler: (((_event: Event) => void) | null) = null

  // Track View Transitions
  private isInitialized = false
  private static isModalCurrentlyVisible = false

  /**
   * Lit lifecycle: called when element is connected
   */
  override connectedCallback(): void {
    super.connectedCallback()
    const context = { scriptName: 'ConsentBannerElement', operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize())
    } else {
      this.initialize()
    }
  }

  /**
   * Initialize the consent banner after DOM is ready
   */
  private initialize(): void {
    const context = { scriptName: 'ConsentBannerElement', operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      // Skip if already initialized
      if (this.isInitialized) {
        return
      }

      // Find elements within this component
      this.findElements()

      // Set up View Transitions handlers
      this.setViewTransitionsHandlers()

      // Show modal if needed
      this.showModal()

      this.isInitialized = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Find and cache DOM elements
   */
  private findElements(): void {
    this.wrapper = getConsentWrapper()
    this.closeBtn = getConsentCloseBtn()
    this.allowBtn = getConsentAllowBtn()
    this.customizeBtn = getConsentCustomizeBtn()
  }

  /**
   * Set up View Transitions event handlers to preserve modal state
   */
  private setViewTransitionsHandlers(): void {
    const context = { scriptName: 'ConsentBannerElement', operation: 'setViewTransitionsHandlers' }
    addScriptBreadcrumb(context)

    try {
      // Before page swap, save the current modal visibility state
      document.addEventListener('astro:before-swap', () => {
        if (this.wrapper && this.wrapper.style.display === 'block') {
          ConsentBannerElement.isModalCurrentlyVisible = true
          sessionStorage.setItem('consent-modal-visible', 'true')
        } else {
          ConsentBannerElement.isModalCurrentlyVisible = false
          sessionStorage.removeItem('consent-modal-visible')
        }
      })

      // After page swap, restore modal state if needed
      document.addEventListener('astro:after-swap', () => {
        // The modal will be re-initialized by the new page's script
        // The showModal method will check the static state and session storage
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Initialize the consent modal
   */
  private initModal(): void {
    const context = { scriptName: 'ConsentBannerElement', operation: 'initModal' }
    addScriptBreadcrumb(context)

    try {
      this.wrapper.style.display = 'block'

      // NOTE: We intentionally do NOT make main content inert
      // The modal should be non-blocking and allow page interaction
      // Modal persists across page navigations until user makes a choice

      // Set up focus trap (but don't enforce it - allow escape)
      this.setupFocusTrap()

      // Focus the first focusable element (allow button)
      this.allowBtn.focus()

      showConsentBanner()
      ConsentBannerElement.isModalCurrentlyVisible = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Modal dismiss event handler
   */
  private handleDismissModal = (): void => {
    console.log('🍪 Modal dismissed by user')

    // Remove focus trap
    this.removeFocusTrap()

    this.wrapper.style.display = 'none'
    hideConsentBanner()
    ConsentBannerElement.isModalCurrentlyVisible = false

    // Clear session storage flags when user dismisses
    sessionStorage.removeItem('consent-modal-visible')
    sessionStorage.removeItem('consent-modal-shown')
  }

  /**
   * Wrapper dismiss handler with event propagation control
   */
  private handleWrapperDismissModal = (event: Event): void => {
    this.handleDismissModal()
    event.stopPropagation() // sandbox Escape key press in the modal
  }

  /**
   * Allow All button event handlers
   */
  private handleAllowAllCookies = (): void => {
    const context = { scriptName: 'ConsentBannerElement', operation: 'allowAllCookies' }
    addScriptBreadcrumb(context)

    try {
      console.log('🍪 User accepted all cookies')
      allowAllConsentCookies()

      // Remove focus trap
      this.removeFocusTrap()

      // Clear session storage so modal won't persist after consent
      sessionStorage.removeItem('consent-modal-shown')
      sessionStorage.removeItem('consent-modal-visible')
      this.wrapper.style.display = 'none'
      hideConsentBanner()
      ConsentBannerElement.isModalCurrentlyVisible = false
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Customize Cookies button event handlers
   */
  private handleCustomizeCookies = (): void => {
    const context = { scriptName: 'ConsentBannerElement', operation: 'customizeCookies' }
    addScriptBreadcrumb(context)

    try {
      showConsentCustomizeModal()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Bind all event listeners
   */
  private bindEvents(): void {
    const context = { scriptName: 'ConsentBannerElement', operation: 'bindEvents' }
    addScriptBreadcrumb(context)

    try {
      // Listener for 'Escape' keyup event when focus is in modal
      addWrapperEventListeners(this.wrapper, this.handleWrapperDismissModal)
      // Listeners for 'click', 'Enter' keyup, and 'touchend' events
      addButtonEventListeners(this.closeBtn, this.handleDismissModal)
      // 'Allow All' button listeners
      addButtonEventListeners(this.allowBtn, this.handleAllowAllCookies)
      // 'Customize' button listeners
      addButtonEventListeners(this.customizeBtn, this.handleCustomizeCookies)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Show the consent modal if user hasn't consented yet
   */
  private showModal(): void {
    const context = { scriptName: 'ConsentBannerElement', operation: 'showModal' }
    addScriptBreadcrumb(context)

    try {
      // Check if modal was already visible from previous page (before any other logic)
      const wasVisible = this.wrapper.style.display === 'block' || this.wrapper.style.display === 'flex'
      console.log('🍪 Cookie Modal Debug:', {
        wasVisible,
        wrapperDisplay: this.wrapper.style.display,
        sessionVisible: sessionStorage.getItem('consent-modal-visible'),
        sessionShown: sessionStorage.getItem('consent-modal-shown'),
        staticVisible: ConsentBannerElement.isModalCurrentlyVisible
      })

      // Check if modal should be visible (multiple sources)
      const shouldBeVisible = wasVisible ||
        ConsentBannerElement.isModalCurrentlyVisible ||
        sessionStorage.getItem('consent-modal-visible') === 'true'

      if (shouldBeVisible) {
        console.log('🍪 Restoring modal from previous navigation')
        // Modal was visible before navigation, restore it
        this.initModal()
        this.bindEvents()
        // Ensure session storage is set
        sessionStorage.setItem('consent-modal-visible', 'true')
        sessionStorage.setItem('consent-modal-shown', 'true')
        return
      }

      // Skip modal if user has already consented
      if (!initConsentCookies()) {
        console.log('🍪 User already consented, skipping modal')
        return
      }

      // Show modal for first time if not shown yet
      if (sessionStorage.getItem('consent-modal-shown') !== 'true') {
        console.log('🍪 Showing modal for first time')
        this.initModal()
        this.bindEvents()

        // Mark modal as shown and visible for this session
        sessionStorage.setItem('consent-modal-shown', 'true')
        sessionStorage.setItem('consent-modal-visible', 'true')
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Set up focus trap within the modal
   */
  private setupFocusTrap(): void {
    const context = { scriptName: 'ConsentBannerElement', operation: 'setupFocusTrap' }
    addScriptBreadcrumb(context)

    try {
      // Get all focusable elements within the modal
      const focusableElements = this.wrapper.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      if (!(firstFocusable instanceof HTMLElement) || !(lastFocusable instanceof HTMLElement)) return

      // Handle Tab key navigation within modal
      this.trapFocusHandler = (e: Event) => {
        const keyEvent = e as KeyboardEvent
        if (keyEvent.key === 'Tab') {
          if (keyEvent.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
              keyEvent.preventDefault()
              lastFocusable.focus()
            }
          } else {
            // Tab
            if (document.activeElement === lastFocusable) {
              keyEvent.preventDefault()
              firstFocusable.focus()
            }
          }
        }
      }

      addWrapperEventListeners(this.wrapper, this.trapFocusHandler)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Remove focus trap
   */
  private removeFocusTrap(): void {
    const context = { scriptName: 'ConsentBannerElement', operation: 'removeFocusTrap' }
    addScriptBreadcrumb(context)

    try {
      if (this.trapFocusHandler) {
        this.wrapper.removeEventListener('keyup', this.trapFocusHandler)
        this.trapFocusHandler = null
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }
}

// Register the custom element
if (!customElements.get('consent-banner')) {
  customElements.define('consent-banner', ConsentBannerElement)
}
