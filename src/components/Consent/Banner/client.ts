import { LoadableScript, type TriggerEvent } from '@components/scripts/loader/@types'
import {
  addButtonEventListeners,
  addWrapperEventListeners,
} from '@components/scripts/elementListeners'
import { $cookieModalVisible } from '@components/Consent/Banner/state'
import { initConsentCookies, allowAllConsentCookies } from '@components/Consent/Banner/cookies'
import { showCookieCustomizeModal } from '@components/Consent/Preferences/client'
import {
  getCookieConsentAllowBtn,
  getCookieConsentCloseBtn,
  getCookieConsentCustomizeBtn,
  getCookieConsentWrapper,
} from '@components/Consent/Banner/selectors'
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { handleScriptError, addScriptBreadcrumb } from '@components/scripts/errors'

/**
 * Cookie Consent component using LoadableScript pattern with instance-specific approach
 * Manages the cookie consent modal display and user interactions across View Transitions
 */
export class CookieConsent extends LoadableScript {
  static override scriptName = 'CookieConsent'
  static override eventType: TriggerEvent = 'astro:page-load'

  /** Modal wrapper element */
  wrapper: HTMLDivElement
  /** Close button element */
  closeBtn: HTMLButtonElement
  /** Allow All button element */
  allowBtn: HTMLButtonElement
  /** Customize button element */
  customizeBtn: HTMLButtonElement
  /** Focus trap handler reference for proper cleanup */
  private trapFocusHandler: ((_event: Event) => void) | null = null
  /** Static reference to track modal visibility across View Transitions */
  private static isModalCurrentlyVisible = false
  /** Flag to ensure View Transitions handlers are only set up once */
  private static viewTransitionsSetup = false

  constructor() {
    super()

    try {
      this.wrapper = getCookieConsentWrapper()
      this.closeBtn = getCookieConsentCloseBtn()
      this.allowBtn = getCookieConsentAllowBtn()
      this.customizeBtn = getCookieConsentCustomizeBtn()

      // Set up View Transitions event listeners for modal persistence (only once)
      if (!CookieConsent.viewTransitionsSetup) {
        this.setupViewTransitionsHandlers()
        CookieConsent.viewTransitionsSetup = true
      }
    } catch (error) {
      throw new ClientScriptError(
        `CookieConsent: Failed to find required DOM elements - ${error instanceof Error ? error.message : 'Unknown error'}. Cookie consent is a legal requirement and cannot function without these elements.`
      )
    }
  }

  /**
   * Set up View Transitions event handlers to preserve modal state
   */
  setupViewTransitionsHandlers() {
    const context = { scriptName: CookieConsent.scriptName, operation: 'setupViewTransitionsHandlers' }
    addScriptBreadcrumb(context)

    try {
      // Before page swap, save the current modal visibility state
      document.addEventListener('astro:before-swap', () => {
        if (this.wrapper && this.wrapper.style.display === 'block') {
          CookieConsent.isModalCurrentlyVisible = true
          sessionStorage.setItem('cookie-modal-visible', 'true')
        } else {
          CookieConsent.isModalCurrentlyVisible = false
          sessionStorage.removeItem('cookie-modal-visible')
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
   * Initialize the cookie consent modal
   */
  initModal() {
    const context = { scriptName: CookieConsent.scriptName, operation: 'initModal' }
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

      $cookieModalVisible.set(true)
      CookieConsent.isModalCurrentlyVisible = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Modal dismiss event handler
   */
    handleDismissModal = () => {
    console.log('🍪 Modal dismissed by user')

    // Remove focus trap
    this.removeFocusTrap()

    this.wrapper.style.display = 'none'
    $cookieModalVisible.set(false)
    CookieConsent.isModalCurrentlyVisible = false

    // Clear session storage flags when user dismisses
    sessionStorage.removeItem('cookie-modal-visible')
    sessionStorage.removeItem('cookie-consent-modal-shown')
  }

  /**
   * Wrapper dismiss handler with event propagation control
   */
  handleWrapperDismissModal = (event: Event) => {
    this.handleDismissModal()
    event.stopPropagation() // sandbox Escape key press in the modal
  }

  /**
   * Allow All button event handlers
   */
  handleAllowAllCookies = () => {
    const context = { scriptName: CookieConsent.scriptName, operation: 'allowAllCookies' }
    addScriptBreadcrumb(context)

    try {
      console.log('🍪 User accepted all cookies')
      allowAllConsentCookies()

      // Remove focus trap
      this.removeFocusTrap()

      /** Clear session storage so modal won't persist after consent */
      sessionStorage.removeItem('cookie-consent-modal-shown')
      sessionStorage.removeItem('cookie-modal-visible')
      this.wrapper.style.display = 'none'
      $cookieModalVisible.set(false)
      CookieConsent.isModalCurrentlyVisible = false
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Customize Cookies button event handlers
   */
  handleCustomizeCookies = () => {
    const context = { scriptName: CookieConsent.scriptName, operation: 'customizeCookies' }
    addScriptBreadcrumb(context)

    try {
      showCookieCustomizeModal()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    const context = { scriptName: CookieConsent.scriptName, operation: 'bindEvents' }
    addScriptBreadcrumb(context)

    try {
      /** Listener for 'Escape' keyup event when focus is in modal */
      addWrapperEventListeners(this.wrapper, this.handleWrapperDismissModal)
      /** Listeners for 'click', 'Enter' keyup, and 'touchend' events */
      addButtonEventListeners(this.closeBtn, this.handleDismissModal)
      /** 'Allow All' button listeners */
      addButtonEventListeners(this.allowBtn, this.handleAllowAllCookies)
      /** 'Customize' button listeners */
      addButtonEventListeners(this.customizeBtn, this.handleCustomizeCookies)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Show the cookie consent modal if user hasn't consented yet
   */
  showModal() {
    const context = { scriptName: CookieConsent.scriptName, operation: 'showModal' }
    addScriptBreadcrumb(context)

    try {
      // Check if modal was already visible from previous page (before any other logic)
      const wasVisible = this.wrapper.style.display === 'block' || this.wrapper.style.display === 'flex'
      console.log('🍪 Cookie Modal Debug:', {
        wasVisible,
        wrapperDisplay: this.wrapper.style.display,
        sessionVisible: sessionStorage.getItem('cookie-modal-visible'),
        sessionShown: sessionStorage.getItem('cookie-consent-modal-shown'),
        staticVisible: CookieConsent.isModalCurrentlyVisible
      })

      /** Check if modal should be visible (multiple sources) */
      const shouldBeVisible = wasVisible ||
        CookieConsent.isModalCurrentlyVisible ||
        sessionStorage.getItem('cookie-modal-visible') === 'true'

      if (shouldBeVisible) {
        console.log('🍪 Restoring modal from previous navigation')
        // Modal was visible before navigation, restore it
        this.initModal()
        this.bindEvents()
        // Ensure session storage is set
        sessionStorage.setItem('cookie-modal-visible', 'true')
        sessionStorage.setItem('cookie-consent-modal-shown', 'true')
        return
      }

      /** Skip modal if user has already consented */
      if (!initConsentCookies()) {
        console.log('🍪 User already consented, skipping modal')
        return
      }

      /** Show modal for first time if not shown yet */
      if (sessionStorage.getItem('cookie-consent-modal-shown') !== 'true') {
        console.log('🍪 Showing modal for first time')
        this.initModal()
        this.bindEvents()

        /** Mark modal as shown and visible for this session */
        sessionStorage.setItem('cookie-consent-modal-shown', 'true')
        sessionStorage.setItem('cookie-modal-visible', 'true')
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Set up focus trap within the modal
   */
  private setupFocusTrap() {
    const context = { scriptName: CookieConsent.scriptName, operation: 'setupFocusTrap' }
    addScriptBreadcrumb(context)

    try {
      // Get all focusable elements within the modal
      const focusableElements = this.wrapper.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      const firstFocusable = focusableElements[0] as HTMLElement
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

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
  private removeFocusTrap() {
    const context = { scriptName: CookieConsent.scriptName, operation: 'removeFocusTrap' }
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

  /**
   * LoadableScript static methods
   */
  static override init(): void {
    const cookieConsent = new CookieConsent()
    cookieConsent.showModal()
  }

  static override pause(): void {
    // Cookie consent doesn't need pause functionality during visibility changes
  }

  static override resume(): void {
    // Cookie consent doesn't need resume functionality during visibility changes
  }

  static override reset(): void {
    // Preserve modal visibility state during View Transitions
    // This method is called before View Transitions swap content
    const currentModal = document.getElementById('cookie-modal-id')
    if (currentModal && currentModal.style.display === 'block') {
      sessionStorage.setItem('cookie-modal-visible', 'true')
      CookieConsent.isModalCurrentlyVisible = true
    } else {
      // Only remove if modal was explicitly closed, not just hidden during transition
      if (!CookieConsent.isModalCurrentlyVisible) {
        sessionStorage.removeItem('cookie-modal-visible')
      }
    }
  }
}
