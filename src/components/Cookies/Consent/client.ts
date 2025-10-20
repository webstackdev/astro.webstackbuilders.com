import { LoadableScript, type TriggerEvent } from '@components/Scripts/loader/@types/loader'
import {
  addButtonEventListeners,
  addLinkEventListeners,
  addWrapperEventListeners,
} from '@components/Scripts/elementListeners'
import { $cookieModalVisible } from './state'
import { initConsentCookies, allowAllConsentCookies } from './cookies'
import { showCookieCustomizeModal } from '../Customize/client'
import {
  getCookieConsentAllowBtn,
  getCookieConsentAllowLink,
  getCookieConsentCloseBtn,
  getCookieConsentCustomizeBtn,
  getCookieConsentCustomizeLink,
  getCookieConsentWrapper,
} from './selectors'
import { ClientScriptError } from '@components/Scripts/errors/ClientScriptError'
import { handleScriptError, addScriptBreadcrumb } from '@components/Scripts/errors'

/**
 * Cookie Consent component using LoadableScript pattern with instance-specific approach
 * Manages the cookie consent modal display and user interactions
 */
export class CookieConsent extends LoadableScript {
  static override scriptName = 'CookieConsent'
  static override eventType: TriggerEvent = 'delayed'

  /** Modal wrapper element */
  wrapper: HTMLDivElement
  /** Close button element */
  closeBtn: HTMLButtonElement
  /** Allow All button element */
  allowBtn: HTMLButtonElement
  /** Allow All link element */
  allowLink: HTMLButtonElement
  /** Customize button element */
  customizeBtn: HTMLButtonElement
  /** Customize link element */
  customizeLink: HTMLAnchorElement

  constructor() {
    super()

    try {
      this.wrapper = getCookieConsentWrapper()
      this.closeBtn = getCookieConsentCloseBtn()
      this.allowBtn = getCookieConsentAllowBtn()
      this.allowLink = getCookieConsentAllowLink()
      this.customizeBtn = getCookieConsentCustomizeBtn()
      this.customizeLink = getCookieConsentCustomizeLink()
    } catch (error) {
      throw new ClientScriptError(
        `CookieConsent: Failed to find required DOM elements - ${error instanceof Error ? error.message : 'Unknown error'}. Cookie consent is a legal requirement and cannot function without these elements.`
      )
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
      this.allowBtn.focus()
      $cookieModalVisible.set(true)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Close button and Escape key press event handler
   */
  handleDismissModal = () => {
    this.wrapper.style.display = 'none'
    $cookieModalVisible.set(false)
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
      allowAllConsentCookies()
      this.handleDismissModal()
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
      addButtonEventListeners(this.allowLink, this.handleAllowAllCookies)
      /** 'Customize' button listeners */
      addButtonEventListeners(this.customizeBtn, this.handleCustomizeCookies)
      addLinkEventListeners(this.customizeLink, this.handleCustomizeCookies)
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
      /** Skip modal if user has already consented */
      if (!initConsentCookies()) return
      this.initModal()
      this.bindEvents()
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
    // Clean up any global state if needed for View Transitions
    // Modal state is managed by local/session storage
  }
}
