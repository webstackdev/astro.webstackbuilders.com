/**
 * ThemePicker component using LoadableScript pattern with instance-specific approach
 * Manages theme selection and persistence with modal interface
 */

import { addButtonEventListeners } from '@components/Scripts/elementListeners'
import { getNavToggleBtnElement } from '@components/Navigation/selectors'
import { LoadableScript, type TriggerEvent } from '../Scripts/loader/@types/loader'
import { $theme, setTheme } from '@lib/state'
import {
  getThemePickerToggleButton,
  getThemePickerModalWrapper,
  getThemePickerCloseButton,
  getThemePickerSelectButtons,
} from './selectors'

export const CLASSES = {
  isOpen: 'is-open',
  active: 'is-active',
}

export type ThemeIds = 'default' | 'dark' | 'holiday'

/**
 * Interface for global meta colors object
 */
interface MetaColors {
  [key: string]: string
}

/**
 * Extend Window interface to include metaColors
 */
declare global {
  interface Window {
    metaColors?: MetaColors
  }
}

/**
 * ThemePicker component using LoadableScript pattern with instance-specific approach
 * Handles theme selection, modal interactions, and persistence
 */
export class ThemePicker extends LoadableScript {
  static override scriptName = 'ThemePicker'
  static override eventType: TriggerEvent = 'delayed'

  private isModalOpen: boolean = false
  private activeTheme: ThemeIds
  /** Wrapper <div> for the theme picker drop down component */
  private pickerModal!: HTMLDivElement
  /** <button> element to toggle the picker in site <header> */
  private toggleBtn!: HTMLButtonElement
  /** close <button> element for the theme picker drop down */
  private closeBtn!: HTMLButtonElement
  /** <button> element on each theme in drop down component to select that theme */
  private themeSelectBtns!: NodeListOf<HTMLButtonElement>

  constructor() {
    super()
    this.activeTheme = this.getInitialActiveTheme()
    this.findElements()
  }

  /**
   * Find and cache DOM elements
   */
  private findElements(): void {
    try {
      this.pickerModal = getThemePickerModalWrapper()
      this.toggleBtn = getThemePickerToggleButton()
      this.closeBtn = getThemePickerCloseButton()
      this.themeSelectBtns = getThemePickerSelectButtons()
    } catch (error) {
      console.error('ThemePicker: Error finding DOM elements:', error)
      throw error
    }
  }

  /**
   * Initialize the theme picker
   */
  private initializeThemePicker(): void {
    if (!CSS.supports('color', 'var(--fake-var)')) {
      console.log('ThemePicker: CSS custom properties not supported, theme picker disabled')
      return
    }

    this.setActiveItem()
    this.bindEvents()
    console.log('ThemePicker: initialized successfully')
  }

  /**
   * Get the initial theme based on stored preference or system preference
   */
  private getInitialActiveTheme(): ThemeIds {
    const storedPreference = this.getStoredPreference()
    const systemPreference = this.getSystemPreference()

    if (storedPreference) {
      return storedPreference
    } else if (systemPreference) {
      return systemPreference
    } else {
      return 'default'
    }
  }

  /**
   * Get theme preference from state store
   */
  private getStoredPreference(): ThemeIds | false {
    const storedTheme = $theme.get() as ThemeIds
    return storedTheme && storedTheme !== 'default' ? storedTheme : false
  }

  /**
   * Get system theme preference
   */
  private getSystemPreference(): ThemeIds | false {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return false
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    addButtonEventListeners(this.toggleBtn, () => this.togglePicker())
    addButtonEventListeners(this.closeBtn, () => this.togglePicker(false))

    /**
     * Theme picker modal on mobile should close if it is open and the hamburger menu
     * icon is clicked or pressed.
     */
    addButtonEventListeners(getNavToggleBtnElement(), () => {
      if (this.isModalOpen) {
        this.togglePicker(false)
      }
    })

    /**
     * Add event handlers to each button wrapping a theme item card to set
     * the current theme when activated.
     */
    this.themeSelectBtns.forEach(button => {
      /** Get data-theme attribute value from button wrapping theme item card */
      if (!('theme' in button.dataset))
        throw new Error(`Theme item ${button.name} is missing the 'data-theme' attribute`)

      const themeId = button.dataset['theme'] as ThemeIds
      if (themeId) {
        addButtonEventListeners(button, () => this.setTheme(themeId))
      }
    })
  }

  /**
   * Button element wrapping theme item card gets aria-checked attribute when
   * its theme is the current theme in use on the site.
   */
  private setActiveItem(): void {
    this.themeSelectBtns.forEach(button => {
      button.parentElement?.classList.remove(CLASSES.active)
      button.removeAttribute('aria-checked')

      if ('theme' in button.dataset && button.dataset['theme'] === this.activeTheme) {
        button.parentElement?.classList.add(CLASSES.active)
        button.setAttribute('aria-checked', 'true')
      }
    })
  }

  /**
   * Set the active theme
   */
  private setTheme(themeId: ThemeIds): void {
    /** 1. Update class state with new theme */
    this.activeTheme = themeId
    /** 2. Document body element has the theme name as an attribute: <body data-theme="default"> */
    document.documentElement.setAttribute('data-theme', themeId)
    /** 3. Update state store - automatically handles persistence */
    setTheme(themeId)

    /**
     * 4. Update the meta element set for theme-color:
     * <meta name="theme-color" content="#FFFFFF">
     * Used to set the color of the surrounding user interface for e.g. the
     * browser title bar. It is updated by script when the theme changes.
     */
    this.updateMetaThemeColor(themeId)

    /**
     * 5. Add attribute to the theme item card when its theme is the current site theme for styling
     */
    this.setActiveItem()
  }

  /**
   * Update the meta theme-color element
   */
  private updateMetaThemeColor(themeId: ThemeIds): void {
    const metaElement = document.querySelector('meta[name="theme-color"]')
    if (!metaElement) return

    // Check if metaColors is available on window
    const metaColors = window.metaColors
    if (!metaColors) return

    const metaColor = themeId in metaColors ? (metaColors[themeId] as string) : '#e2e2e2'
    metaElement.setAttribute('content', metaColor)
  }

  /**
   * Determine if modal should open
   */
  private shouldOpen(forceOpen?: boolean): boolean {
    return typeof forceOpen === 'boolean' ? forceOpen : !this.isModalOpen
  }

  /**
   * Toggle the theme picker modal
   */
  private togglePicker(forceOpen?: boolean): void {
    this.isModalOpen = this.shouldOpen(forceOpen)

    /** 1. Set the aria-expanded attribute on the toggle button */
    this.toggleBtn.setAttribute('aria-expanded', String(this.isModalOpen))

    /** Change to open */
    if (this.isModalOpen) {
      /** 2. Remove the hidden property from the theme picker modal */
      this.pickerModal.removeAttribute('hidden')
      /**
       * 3. Add the `is-open` class to the theme picker modal and trigger CSS transition.
       * `setTimeout()` used because it follows removing the element's `display: none;`
       * property, which is treated as if the initial state had never occurred and
       * the element was always in its final state for transitions.
       */
      window.setTimeout(() => {
        this.pickerModal.classList.add(CLASSES.isOpen)
      }, 1)

      /** 4. Set focus to the currently selected theme item in the modal */
      if (this.themeSelectBtns.length) {
        this.themeSelectBtns.item(0).focus()
      }
    } else {
      /** 2. Set the theme picker modal to hidden when the CSS transition has completed */
      const transitionHandler = () => this.pickerModal.setAttribute('hidden', 'true')
      this.pickerModal.addEventListener('transitionend', transitionHandler, { once: true })
      /** 3. Remove the is-open class from the theme picker modal */
      this.pickerModal.classList.remove(CLASSES.isOpen)
      /** 4. Set focus to the toggle button */
      this.toggleBtn.focus()
    }
  }

  /**
   * LoadableScript static methods
   */
  static override init(): void {
    const themePicker = new ThemePicker()
    themePicker.initializeThemePicker()
  }

  static override pause(): void {
    // ThemePicker doesn't need pause functionality during visibility changes
  }

  static override resume(): void {
    // ThemePicker doesn't need resume functionality during visibility changes
  }

  static override reset(): void {
    // Clean up any global state if needed for View Transitions
    // Theme preferences persist across navigations
  }
}
