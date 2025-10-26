/**
 * ThemePicker component using LoadableScript pattern with instance-specific approach
 * Manages theme selection and persistence with modal interface
 */

import { addButtonEventListeners } from '@components/Scripts/elementListeners'
import { getNavToggleBtnElement } from '@components/Navigation/selectors'
import { LoadableScript, type TriggerEvent } from '../Scripts/loader/@types/loader'
import { $theme, setTheme } from '@components/Scripts/state'
import {
  getThemePickerToggleButton,
  getThemePickerModalWrapper,
  getThemePickerCloseButton,
  getThemePickerSelectButtons,
} from './selectors'
import { ClientScriptError } from '@components/Scripts/errors/ClientScriptError'
import { handleScriptError, addScriptBreadcrumb } from '@components/Scripts/errors'

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
  static override eventType: TriggerEvent = 'astro:page-load'

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
    const context = { scriptName: ThemePicker.scriptName, operation: 'findElements' }
    addScriptBreadcrumb(context)

    try {
      this.pickerModal = getThemePickerModalWrapper()
      this.toggleBtn = getThemePickerToggleButton()
      this.closeBtn = getThemePickerCloseButton()
      this.themeSelectBtns = getThemePickerSelectButtons()
    } catch (error) {
      throw new ClientScriptError(
        `ThemePicker: Failed to find required DOM elements - ${error instanceof Error ? error.message : 'Unknown error'}. Theme picker cannot function without these elements.`
      )
    }
  }

  /**
   * Initialize the theme picker
   */
  private initializeThemePicker(): void {
    const context = { scriptName: ThemePicker.scriptName, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      if (!CSS.supports('color', 'var(--fake-var)')) {
        console.log('ThemePicker: CSS custom properties not supported, theme picker disabled')
        return
      }

      this.setActiveItem()
      this.bindEvents()
      console.log('ThemePicker: initialized successfully')
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Get the initial theme based on stored preference or system preference
   */
  private getInitialActiveTheme(): ThemeIds {
    const context = { scriptName: ThemePicker.scriptName, operation: 'getInitialTheme' }
    addScriptBreadcrumb(context)

    try {
      const storedPreference = this.getStoredPreference()
      const systemPreference = this.getSystemPreference()

      if (storedPreference) {
        return storedPreference
      } else if (systemPreference) {
        return systemPreference
      } else {
        return 'default'
      }
    } catch (error) {
      handleScriptError(error, context)
      return 'default'
    }
  }

  /**
   * Get theme preference from state store
   */
  private getStoredPreference(): ThemeIds | false {
    const context = { scriptName: ThemePicker.scriptName, operation: 'getStoredPreference' }
    addScriptBreadcrumb(context)

    try {
      const storedTheme = $theme.get() as ThemeIds
      return storedTheme && storedTheme !== 'default' ? storedTheme : false
    } catch (error) {
      handleScriptError(error, context)
      return false
    }
  }

  /**
   * Get system theme preference
   */
  private getSystemPreference(): ThemeIds | false {
    const context = { scriptName: ThemePicker.scriptName, operation: 'getSystemPreference' }
    addScriptBreadcrumb(context)

    try {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return false
    } catch (error) {
      handleScriptError(error, context)
      return false
    }
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    const context = { scriptName: ThemePicker.scriptName, operation: 'bindEvents' }
    addScriptBreadcrumb(context)

    try {
      addButtonEventListeners(this.toggleBtn, () => this.togglePicker())
      addButtonEventListeners(this.closeBtn, () => this.togglePicker(false))

      /**
       * Theme picker modal on mobile should close if it is open and the hamburger menu
       * icon is clicked or pressed.
       */
      try {
        addButtonEventListeners(getNavToggleBtnElement(), () => {
          if (this.isModalOpen) {
            this.togglePicker(false)
          }
        })
      } catch (error) {
        // Navigation button not found - acceptable, theme picker still works
        handleScriptError(error, { scriptName: ThemePicker.scriptName, operation: 'bindNavToggle' })
      }

      /**
       * Add event handlers to each button wrapping a theme item card to set
       * the current theme when activated.
       */
      this.themeSelectBtns.forEach(button => {
        try {
          /** Get data-theme attribute value from button wrapping theme item card */
          if (!('theme' in button.dataset)) {
            throw new Error(`Theme item ${button.name} is missing the 'data-theme' attribute`)
          }

          const themeId = button.dataset['theme'] as ThemeIds
          if (themeId) {
            addButtonEventListeners(button, () => this.setTheme(themeId))
          }
        } catch (error) {
          // One theme button failing shouldn't break all theme buttons
          handleScriptError(error, { scriptName: ThemePicker.scriptName, operation: 'bindThemeButton' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Button element wrapping theme item card gets aria-checked attribute when
   * its theme is the current theme in use on the site.
   */
  private setActiveItem(): void {
    const context = { scriptName: ThemePicker.scriptName, operation: 'setActiveItem' }
    addScriptBreadcrumb(context)

    try {
      this.themeSelectBtns.forEach(button => {
        try {
          button.parentElement?.classList.remove(CLASSES.active)
          button.removeAttribute('aria-checked')

          if ('theme' in button.dataset && button.dataset['theme'] === this.activeTheme) {
            button.parentElement?.classList.add(CLASSES.active)
            button.setAttribute('aria-checked', 'true')
          }
        } catch (error) {
          // One button failing shouldn't break all buttons
          handleScriptError(error, { scriptName: ThemePicker.scriptName, operation: 'setActiveButton' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Set the active theme
   */
  private setTheme(themeId: ThemeIds): void {
    const context = { scriptName: ThemePicker.scriptName, operation: 'setTheme' }
    addScriptBreadcrumb(context)

    try {
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
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Update the meta theme-color element
   */
  private updateMetaThemeColor(themeId: ThemeIds): void {
    const context = { scriptName: ThemePicker.scriptName, operation: 'updateMetaThemeColor' }
    addScriptBreadcrumb(context)

    try {
      const metaElement = document.querySelector('meta[name="theme-color"]')
      if (!metaElement) return

      // Check if metaColors is available on window
      const metaColors = window.metaColors
      if (!metaColors) return

      const metaColor = themeId in metaColors ? (metaColors[themeId] as string) : '#e2e2e2'
      metaElement.setAttribute('content', metaColor)
    } catch (error) {
      // Meta theme color is optional enhancement
      handleScriptError(error, context)
    }
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
    const context = { scriptName: ThemePicker.scriptName, operation: 'togglePicker' }
    addScriptBreadcrumb(context)

    try {
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
          try {
            this.pickerModal.classList.add(CLASSES.isOpen)
          } catch (error) {
            handleScriptError(error, { scriptName: ThemePicker.scriptName, operation: 'addOpenClass' })
          }
        }, 1)

        /** 4. Set focus to the currently selected theme item in the modal */
        try {
          if (this.themeSelectBtns.length) {
            this.themeSelectBtns.item(0).focus()
          }
        } catch (error) {
          handleScriptError(error, { scriptName: ThemePicker.scriptName, operation: 'focusFirstButton' })
        }
      } else {
        /** 2. Set the theme picker modal to hidden when the CSS transition has completed */
        try {
          const transitionHandler = () => this.pickerModal.setAttribute('hidden', 'true')
          this.pickerModal.addEventListener('transitionend', transitionHandler, { once: true })
        } catch (error) {
          // Fallback: set hidden immediately if transition fails
          handleScriptError(error, { scriptName: ThemePicker.scriptName, operation: 'transitionHandler' })
          this.pickerModal.setAttribute('hidden', 'true')
        }
        /** 3. Remove the is-open class from the theme picker modal */
        this.pickerModal.classList.remove(CLASSES.isOpen)
        /** 4. Set focus to the toggle button */
        try {
          this.toggleBtn.focus()
        } catch (error) {
          handleScriptError(error, { scriptName: ThemePicker.scriptName, operation: 'focusToggleButton' })
        }
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * LoadableScript static methods
   */
  static override init(): void {
    const context = { scriptName: ThemePicker.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
      const themePicker = new ThemePicker()
      themePicker.initializeThemePicker()
    } catch (error) {
      handleScriptError(error, context)
    }
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
