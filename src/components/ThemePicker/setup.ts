import { addButtonEventListeners } from '@lib/utils/elementListeners'
import { getNavToggleBtnElement } from '@components/Navigation/selectors'
import {
  getThemePickerToggleButton,
  getThemePickerModalWrapper,
  getThemePickerCloseButton,
  getThemePickerSelectButtons,
} from './selectors'

const THEME_STORAGE_KEY = 'theme'
export const CLASSES = {
  isOpen: `is-open`,
  active: `is-active`,
}

export type ThemeIds = `default` | `dark` | `holiday`

export class ThemePicker {
  isModalOpen: boolean
  activeTheme: ThemeIds
  /** Wrapper <div> for the theme picker drop down component */
  pickerModal: HTMLDivElement
  /** <button> element to toggle the picker in site <header> */
  toggleBtn: HTMLButtonElement
  /** close <button> element for the theme picker drop down */
  closeBtn: HTMLButtonElement
  /** <button> element on each theme in drop down component to select that theme */
  themeSelectBtns: NodeListOf<HTMLButtonElement>

  constructor() {
    console.log('ThemePicker constructor called');
    this.isModalOpen = false
    this.activeTheme = this.getInitialActiveTheme()

    try {
      this.pickerModal = getThemePickerModalWrapper()
      console.log('Found picker modal:', this.pickerModal);
    } catch (error) {
      console.error('Error getting picker modal:', error);
      throw error;
    }

    try {
      this.toggleBtn = getThemePickerToggleButton()
      console.log('Found toggle button:', this.toggleBtn);
    } catch (error) {
      console.error('Error getting toggle button:', error);
      throw error;
    }

    try {
      this.closeBtn = getThemePickerCloseButton()
      console.log('Found close button:', this.closeBtn);
    } catch (error) {
      console.error('Error getting close button:', error);
      throw error;
    }

    try {
      this.themeSelectBtns = getThemePickerSelectButtons()
      console.log('Found theme select buttons:', this.themeSelectBtns.length);
    } catch (error) {
      console.error('Error getting theme select buttons:', error);
      throw error;
    }
  }

  init() {
    this.setActiveItem()
    this.bindEvents()
    //iconAnimationInit()
  }

  hasLocalStorage() {
    return typeof Storage !== `undefined`
  }

  getInitialActiveTheme() {
    const storedPreference = this.getStoredPreference()
    const systemPreference = this.getSystemPreference()

    if (storedPreference) {
      return storedPreference
    } else if (systemPreference) {
      return systemPreference
    } else {
      return `default`
    }
  }

  getStoredPreference(): ThemeIds | false {
    let storedPreference
    if (this.hasLocalStorage()) {
      storedPreference = localStorage.getItem(THEME_STORAGE_KEY) as ThemeIds
    }
    return (storedPreference as ThemeIds) ?? false
  }

  getSystemPreference(): ThemeIds | false {
    let systemPreference
    if (window.matchMedia(`(prefers-color-scheme: dark)`).matches) {
      systemPreference = `dark`
    }
    return (systemPreference as ThemeIds) ?? false
  }

  bindEvents() {
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
  setActiveItem() {
    this.themeSelectBtns.forEach(button => {
      button.parentElement!.classList.remove(CLASSES.active)
      button.removeAttribute(`aria-checked`)

      if ('theme' in button.dataset && button.dataset['theme'] === this.activeTheme) {
        button.parentElement!.classList.add(CLASSES.active)
        button.setAttribute(`aria-checked`, `aria-checked`)
      }
    })
  }

  setTheme(themeId: ThemeIds) {
    /** 1. Update class state with new theme */
    this.activeTheme = themeId
    /** 2. Document body element has the theme name as an attribute: <body data-theme="default"> */
    document.documentElement.setAttribute(`data-theme`, themeId)
    /** 3. Update the theme name in local storage, used for persistence between site visits */
    if (this.hasLocalStorage()) localStorage.setItem(THEME_STORAGE_KEY, themeId)
    /**
     *  4. Update the meta element set in meta.njk for theme-color:
     *       <meta name="theme-color" content="#FFFFFF">
     *     Used to set the color of the surrounding user interface for e.g. the
     *     browser title bar. It is updated by script when the theme changes.
     */
    if (!!document.querySelector(`meta[name="theme-color"]`) && (window as any).metaColors) {
      const metaColors = (window as any).metaColors;
      const metaColor =
        themeId in metaColors ? (metaColors[themeId] as string) : `#e2e2e2`
      const metaTag = document.querySelector(`meta[name="theme-color"]`)
      if (metaTag) {
        metaTag.setAttribute(`content`, metaColor)
      } else {
        throw new Error(`Header <meta> element not set for 'theme-color'`)
      }
    }
    /**
     *  5. Add attribute to the theme item card when its theme is the current site theme for styling
     */
    this.setActiveItem()
  }

  shouldOpen(forceOpen?: boolean) {
    return typeof forceOpen === `boolean` ? forceOpen : !this.isModalOpen
  }

  togglePicker(forceOpen?: boolean) {
    this.isModalOpen = this.shouldOpen(forceOpen)

    /** 1. Set the aria-expanded attribute on the toggle button */
    this.toggleBtn.setAttribute('aria-expanded', String(this.isModalOpen))

    /** Change to open */
    if (this.isModalOpen) {
      /** 2. Remove the hidden property from the theme picker modal */
      this.pickerModal.removeAttribute(`hidden`)
      /**
       *  3. Add the `is-open` class to the theme picker modal and trigger CSS transition.
       *     `setTimeout()` used because it follows removing the element's `display: none;`
       *     property, which is treated as if the initial state had never occurred and
       *     the element was always in its final state for transitions.
       */
      window.setTimeout(() => {
        this.pickerModal.classList.add(CLASSES.isOpen)
      }, 1)

      /** 4. Set focus to the currently selected theme item in the modal */
      if (this.themeSelectBtns.length) {
        this.themeSelectBtns.item(0).focus()
      }
      /** Change to close */
    } else {
      /** 2. Set the theme picker modal to hidden when the CSS transition has completed */
      const transitionHandler = () => this.pickerModal.setAttribute(`hidden`, `hidden`)
      this.pickerModal.addEventListener(`transitionend`, transitionHandler, { once: true })
      /** 3. Remove the is-open class from the theme picker modal */
      this.pickerModal.classList.remove(CLASSES.isOpen)
      /** 4. Set focus to the toggle button */
      this.toggleBtn.focus()
    }
  }
}

export const setupThemePicker = () => {
  console.log('setupThemePicker called');

  // Wait for DOM to be ready before setting up
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemePicker)
    return
  }

  initializeThemePicker()
}

const initializeThemePicker = () => {
  if (CSS.supports(`color`, `var(--fake-var)`)) {
    console.log('CSS custom properties supported, initializing theme picker...');
    try {
      const picker = new ThemePicker()
      picker.init()
      console.log('Theme picker initialized successfully');
    } catch (error) {
      console.error('Error initializing theme picker:', error);
    }
  } else {
    console.log('CSS custom properties not supported, theme picker disabled');
  }
}


