/**
 * ThemePicker Web Component (Lit + Nanostores)
 * Manages theme selection and persistence using Lit and Nanostores
 * Works seamlessly with Astro View Transitions
 */

import { LitElement } from 'lit'
import {
  setTheme,
  toggleThemePicker,
  closeThemePicker,
  createThemeController,
  createThemePickerOpenController,
  type ThemeId,
} from '@components/scripts/store'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import {
  getThemePickerModal,
  getThemePickerToggleBtn,
  getThemePickerCloseBtn,
  getThemeSelectBtns,
} from './selectors'
import { defineCustomElement } from '@components/scripts/utils'

export const CLASSES = {
  isOpen: 'is-open',
  active: 'is-active',
}

/**
 * ThemePicker Custom Element (Lit-based)
 * Uses Light DOM (no Shadow DOM) with Astro-rendered templates
 * Lit provides reactive store integration via StoreController
 */
export class ThemePickerElement extends LitElement {
  // Render to Light DOM instead of Shadow DOM
  override createRenderRoot() {
    return this // No shadow DOM - works with Astro templates!
  }

  // Reactive store bindings - Lit auto-updates when these change
  private themeStore = createThemeController(this)
  private themePickerOpenStore = createThemePickerOpenController(this)

  // Cache DOM elements
  private pickerModal!: HTMLDivElement
  private toggleBtn!: HTMLButtonElement
  private closeBtn!: HTMLButtonElement
  private themeSelectBtns!: NodeListOf<HTMLButtonElement>

  // Track View Transitions
  private isTransitioning = false
  private isInitialized = false
  private isTogglingViaButton = false

  /**
   * Lit lifecycle: called when element is connected
   */
  override connectedCallback(): void {
    super.connectedCallback()
    const context = { scriptName: 'ThemePickerElement', operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize())
    } else {
      this.initialize()
    }
  }

  /**
   * Initialize the theme picker after DOM is ready
   */
  private initialize(): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      // Skip if already initialized (for View Transitions)
      if (this.isInitialized) {
        return
      }

      // Find elements within this component
      this.findElements()

      // Check if CSS custom properties are supported
      if (!CSS.supports('color', 'var(--fake-var)')) {
        console.log('ThemePicker: CSS custom properties not supported, theme picker disabled')
        return
      }

      this.bindEvents()
      this.setViewTransitionHandlers()
      this.isInitialized = true

      // Initial update (Lit + StoreController will handle all reactivity automatically)
      this.requestUpdate()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Lit lifecycle: called after properties change
   * Lit automatically calls this when stores update via StoreController
   */
  override updated(): void {
    // Guard: Don't update until component is initialized
    if (!this.isInitialized) {
      return
    }

    const isOpen = this.themePickerOpenStore.value
    const currentTheme = this.themeStore.value

    // Update modal visibility
    this.updateModalVisibility(isOpen)

    // Update active theme button
    this.updateActiveTheme(currentTheme)
  }

  /**
   * Find and cache DOM elements within this component
   */
  private findElements(): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'findElements' }
    addScriptBreadcrumb(context)
    this.pickerModal = getThemePickerModal(this)
    this.toggleBtn = getThemePickerToggleBtn()
    this.closeBtn = getThemePickerCloseBtn(this)
    this.themeSelectBtns = getThemeSelectBtns(this)
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'bindEvents' }
    addScriptBreadcrumb(context)

    try {
      // Toggle button - stop propagation to prevent "click outside" handler
      addButtonEventListeners(this.toggleBtn, (e) => {
        e.stopPropagation()
        this.handleToggle()
      }, this)

      // Close button
      addButtonEventListeners(this.closeBtn, () => this.handleClose(), this)

      // Theme selection buttons
      this.themeSelectBtns.forEach((button) => {
        try {
          if (!('theme' in button.dataset)) {
            throw new ClientScriptError({
              message: `Theme item ${button.name} is missing the 'data-theme' attribute`
            })
          }

          const themeId = button.dataset['theme'] as ThemeId
          if (themeId) {
            addButtonEventListeners(button, (e) => {
              // Stop ALL event propagation to prevent "click outside" handler
              e.stopImmediatePropagation()
              this.applyTheme(themeId)
            }, this)
          }
        } catch (error) {
          handleScriptError(error, { scriptName: 'ThemePickerElement', operation: 'bindThemeButton' })
        }
      })

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.themePickerOpenStore.value) {
          this.handleClose()
        }
      })

      // Close on click outside (but not during View Transitions)
      // Use bubble phase (default) so button handlers run first and can stopPropagation
      document.addEventListener('click', (e) => {
        // Skip if transitioning or if toggle button is actively being clicked
        if (this.isTransitioning) return
        if (this.isTogglingViaButton) return

        const target = e.target
        if (!(target instanceof HTMLElement)) return

        const isInsideModal = this.pickerModal.contains(target)
        const isToggleButton = this.toggleBtn.contains(target) || target === this.toggleBtn

        // Close if clicking outside modal and not on toggle button
        // This runs in bubble phase, after button handlers, so stopPropagation works
        if (this.themePickerOpenStore.value && !isInsideModal && !isToggleButton) {
          this.handleClose()
        }
      }) // Default bubble phase - button handlers run first

      // Mobile-specific: Handle touchend separately since it fires before click
      // and can have different event targets due to SVG children
      document.addEventListener('touchend', (e) => {
        // Skip if transitioning or if toggle button is actively being clicked
        if (this.isTransitioning) return
        if (this.isTogglingViaButton) return

        const target = e.target
        if (!(target instanceof HTMLElement)) return

        const isInsideModal = this.pickerModal.contains(target)
        const isToggleButton = this.toggleBtn.contains(target) || target === this.toggleBtn

        // Close only if touching outside both modal and toggle button
        if (this.themePickerOpenStore.value && !isInsideModal && !isToggleButton) {
          this.handleClose()
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }  /**
      * Set up View Transition handlers
      */
  private setViewTransitionHandlers(): void {
    document.addEventListener('astro:before-preparation', () => {
      this.isTransitioning = true
    })

    document.addEventListener('astro:after-swap', () => {
      this.isTransitioning = false

      // Re-query DOM elements after swap since HTML was replaced
      // But DON'T re-bind events since this element persists
      try {
        this.findElements()

        // CRITICAL: If modal should be open, apply classes immediately
        // to prevent visual jump (HTML was swapped without the is-open class)
        const isOpen = this.themePickerOpenStore.value
        if (isOpen) {
          // Apply state synchronously before browser paints
          this.pickerModal.removeAttribute('hidden')
          this.pickerModal.classList.add(CLASSES.isOpen)
          this.toggleBtn.setAttribute('aria-expanded', 'true')
        }

        // Force Lit to update with new DOM references
        this.requestUpdate()
      } catch (error) {
        handleScriptError(error, { scriptName: 'ThemePickerElement', operation: 'after-swap' })
      }
    })
  }

  /**
   * Update modal visibility (called by Lit's updated lifecycle)
   */
  private updateModalVisibility(isOpen: boolean): void {
    if (isOpen) {
      // Remove hidden first, then add class after browser paints
      this.pickerModal.removeAttribute('hidden')
      this.toggleBtn.setAttribute('aria-expanded', 'true')

      // Wait for next frame so browser processes max-height: 0 before animating to 14em
      requestAnimationFrame(() => {
        this.pickerModal.classList.add(CLASSES.isOpen)
      })
    } else {
      this.pickerModal.classList.remove(CLASSES.isOpen)

      // Wait for animation before hiding
      const transitionHandler = () => {
        if (!this.themePickerOpenStore.value) {
          this.pickerModal.setAttribute('hidden', '')
        }
        this.pickerModal.removeEventListener('transitionend', transitionHandler)
      }
      this.pickerModal.addEventListener('transitionend', transitionHandler, { once: true })

      this.toggleBtn.setAttribute('aria-expanded', 'false')
    }
  }

  /**
   * Update active theme button styling (called by Lit's updated lifecycle)
   */
  private updateActiveTheme(currentTheme: ThemeId): void {
    try {
      this.themeSelectBtns.forEach((button) => {
        const themeId = button.dataset['theme']
        const parentLi = button.closest('li')

        if (themeId === currentTheme) {
          button.setAttribute('aria-checked', 'true')
          if (parentLi) {
            parentLi.classList.add(CLASSES.active)
          }
        } else {
          button.setAttribute('aria-checked', 'false')
          if (parentLi) {
            parentLi.classList.remove(CLASSES.active)
          }
        }
      })
    } catch (error) {
      handleScriptError(error, { scriptName: 'ThemePickerElement', operation: 'updateActiveTheme' })
    }
  }

  /**
   * Handle toggle button click
   */
  private handleToggle(): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'handleToggle' }
    addScriptBreadcrumb(context)

    try {
      // Set flag to indicate we're toggling via button, not document listener
      this.isTogglingViaButton = true

      // Update state using action function
      toggleThemePicker()

      // Clear flag after a delay to allow document listeners to see it
      setTimeout(() => {
        this.isTogglingViaButton = false
      }, 200)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Handle close button click
   */
  private handleClose(): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'handleClose' }
    addScriptBreadcrumb(context)

    try {
      closeThemePicker()
      this.toggleBtn.focus()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Apply theme to document
   */
  private applyTheme(themeId: ThemeId): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'applyTheme' }
    addScriptBreadcrumb(context)

    try {
      // Update document attribute
      document.documentElement.dataset['theme'] = themeId

      // Update state store (Lit will reactively update via StoreController)
      setTheme(themeId)

      // Update meta theme-color
      this.updateMetaThemeColor(themeId)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Update meta theme-color tag
   */
  private updateMetaThemeColor(themeId: ThemeId): void {
    try {
      if (!window.metaColors) return

      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      const color = window.metaColors[themeId]
      if (metaThemeColor && color) {
        metaThemeColor.setAttribute('content', color)
      }
    } catch (error) {
      // Non-critical - just log
      console.warn('ThemePicker: Failed to update meta theme-color', error)
    }
  }
}

export const registerThemePickerWebComponent = (tagName = 'theme-picker') =>
  defineCustomElement(tagName, ThemePickerElement)
