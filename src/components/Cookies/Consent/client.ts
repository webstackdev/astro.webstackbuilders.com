import { LoadableScript, type TriggerEvent } from '@components/Scripts/loader/@types/loader'
import {
  addButtonEventListeners,
  addLinkEventListeners,
  addWrapperEventListeners,
} from '@components/Scripts/elementListeners'
import { setCookieModalVisibility, initCookieModalVisibility } from './state'
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
    this.wrapper = getCookieConsentWrapper()
    this.closeBtn = getCookieConsentCloseBtn()
    this.allowBtn = getCookieConsentAllowBtn()
    this.allowLink = getCookieConsentAllowLink()
    this.customizeBtn = getCookieConsentCustomizeBtn()
    this.customizeLink = getCookieConsentCustomizeLink()
  }

  /**
   * Initialize the cookie consent modal
   */
  initModal() {
    this.wrapper.style.display = 'block'
    this.allowBtn.focus()
    initCookieModalVisibility()
  }

  /**
   * Close button and Escape key press event handler
   */
  handleDismissModal = () => {
    this.wrapper.style.display = 'none'
    setCookieModalVisibility(false)
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
    allowAllConsentCookies()
    this.handleDismissModal()
  }

  /**
   * Customize Cookies button event handlers
   */
  handleCustomizeCookies = () => {
    showCookieCustomizeModal()
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
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
  }

  /**
   * Show the cookie consent modal if user hasn't consented yet
   */
  showModal() {
    /** Skip modal if user has already consented */
    if (!initConsentCookies()) return
    this.initModal()
    this.bindEvents()
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
