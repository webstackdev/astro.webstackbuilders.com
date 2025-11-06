/**
 * ThemePicker Web Component
 * Manages theme selection and persistence using native Custom Elements API
 * Works seamlessly with Astro View Transitions
 */

import { $theme, $themePickerOpen, setTheme } from '@components/scripts/store'
import { handleScriptError, addScriptBreadcrumb } from '@components/scripts/errors'
import { addButtonEventListeners } from '@components/scripts/elementListeners'

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

declare global {
  interface Window {
    metaColors?: MetaColors
  }
}

/**
 * ThemePicker Custom Element
 * Handles theme selection, modal interactions, and persistence
 */
export class ThemePickerElement extends HTMLElement {
  private isModalOpen = false
  private activeTheme: ThemeIds
  private pickerModal!: HTMLDivElement
  private toggleBtn!: HTMLButtonElement
  private closeBtn!: HTMLButtonElement
  private themeSelectBtns!: NodeListOf<HTMLButtonElement>

  constructor() {
    super()
    this.activeTheme = this.getInitialActiveTheme()
  }

  /**
   * Called when element is added to DOM
   * This is the Web Component lifecycle method
   */
  connectedCallback(): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    // Wait for DOM to be ready before initializing
    // This ensures the toggle button in Header exists
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
      // Find elements within this component
      this.findElements()

      // Check if CSS custom properties are supported
      if (!CSS.supports('color', 'var(--fake-var)')) {
        console.log('ThemePicker: CSS custom properties not supported, theme picker disabled')
        return
      }

      // Sync active theme with what's already set in DOM by HEAD script
      const domTheme = document.documentElement.dataset['theme'] as ThemeIds | undefined
      if (domTheme && domTheme !== this.activeTheme) {
        this.activeTheme = domTheme
      }

      this.setActiveItem()
      this.bindEvents()

      // Restore modal state from store (for View Transitions persistence)
      const wasOpen = $themePickerOpen.get()
      if (wasOpen) {
        // Set open state without animation (for initial page load/navigation)
        this.isModalOpen = true
        this.pickerModal.removeAttribute('hidden')
        this.pickerModal.classList.add(CLASSES.isOpen)
        this.toggleBtn.setAttribute('aria-expanded', 'true')
        // Sync store (already true, but ensures consistency)
        $themePickerOpen.set(true)
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Called when element is removed from DOM
   * Cleanup event listeners
   */
  disconnectedCallback(): void {
    // Event listeners are automatically cleaned up when element is removed
    // but we can do additional cleanup here if needed
  }

  /**
   * Find and cache DOM elements within this component
   */
  private findElements(): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'findElements' }
    addScriptBreadcrumb(context)

    try {
      // Use this.querySelector to scope to this component instance
      this.pickerModal = this.querySelector('[data-theme-modal]') as HTMLDivElement
      this.toggleBtn = document.querySelector('[data-theme-toggle]') as HTMLButtonElement
      this.closeBtn = this.querySelector('[data-theme-close]') as HTMLButtonElement
      this.themeSelectBtns = this.querySelectorAll('[data-theme]') as NodeListOf<HTMLButtonElement>

      if (!this.pickerModal || !this.toggleBtn || !this.closeBtn) {
        throw new Error('Required theme picker elements not found')
      }
    } catch (error) {
      throw new Error(
        `ThemePicker: Failed to find required DOM elements - ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get the initial theme based on stored preference or system preference
   */
  private getInitialActiveTheme(): ThemeIds {
    const context = { scriptName: 'ThemePickerElement', operation: 'getInitialTheme' }
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
    try {
      // Check if theme is actually stored in localStorage (not just default initialization)
      const hasStoredTheme = localStorage.getItem('theme') !== null
      if (!hasStoredTheme) {
        return false
      }
      const storedTheme = $theme.get() as ThemeIds
      return storedTheme || false
    } catch {
      return false
    }
  }

  /**
   * Get system theme preference
   */
  private getSystemPreference(): ThemeIds | false {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'bindEvents' }
    addScriptBreadcrumb(context)

    try {
      // Toggle button
      addButtonEventListeners(this.toggleBtn, () => this.togglePicker(), this)
      // Close button
      addButtonEventListeners(this.closeBtn, () => this.togglePicker(false), this)

      // Theme selection buttons
      this.themeSelectBtns.forEach((button) => {
        try {
          if (!('theme' in button.dataset)) {
            throw new Error(`Theme item ${button.name} is missing the 'data-theme' attribute`)
          }

          const themeId = button.dataset['theme'] as ThemeIds
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
        if (e.key === 'Escape' && this.isModalOpen) {
          this.togglePicker(false)
        }
      })

      // Track if we're in a View Transition to prevent closing modal during navigation
      let isTransitioning = false

      document.addEventListener('astro:before-preparation', () => {
        isTransitioning = true
        // Modal state is persisted via $themePickerOpen store
        // Don't close the modal - it should stay open across navigation
      })

      document.addEventListener('astro:after-swap', () => {
        isTransitioning = false
      })

      // Close on click outside (but not during View Transitions)
      document.addEventListener('click', (e) => {
        if (this.isModalOpen && !isTransitioning) {
          const target = e.target as HTMLElement
          // Check if click is on or inside the modal, toggle button, or any theme button
          const isInsideModal = this.pickerModal.contains(target)
          const isToggleButton = this.toggleBtn.contains(target)
          const isThemeButton = Array.from(this.themeSelectBtns).some(btn => btn.contains(target))

          if (!isInsideModal && !isToggleButton && !isThemeButton) {
            this.togglePicker(false)
          }
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Set active theme button styling
   */
  private setActiveItem(): void {
    try {
      this.themeSelectBtns.forEach((button) => {
        const themeId = button.dataset['theme']
        const parentLi = button.closest('li')

        if (themeId === this.activeTheme) {
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
      handleScriptError(error, { scriptName: 'ThemePickerElement', operation: 'setActiveItem' })
    }
  }

  /**
   * Toggle theme picker modal
   */
  private togglePicker(open?: boolean): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'togglePicker' }
    addScriptBreadcrumb(context)

    try {
      this.isModalOpen = open !== undefined ? open : !this.isModalOpen

      // Sync with store for View Transitions persistence
      $themePickerOpen.set(this.isModalOpen)

      if (this.isModalOpen) {
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
          this.pickerModal.setAttribute('hidden', '')
          this.pickerModal.removeEventListener('transitionend', transitionHandler)
        }
        this.pickerModal.addEventListener('transitionend', transitionHandler, { once: true })

        this.toggleBtn.setAttribute('aria-expanded', 'false')
        this.toggleBtn.focus()
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Set theme and close modal
   */
  /**
   * Apply theme to document
   */
  private applyTheme(themeId: ThemeIds): void {
    const context = { scriptName: 'ThemePickerElement', operation: 'applyTheme' }
    addScriptBreadcrumb(context)

    try {
      this.activeTheme = themeId

      // Update document attribute
      document.documentElement.dataset['theme'] = themeId

      // Update state store
      setTheme(themeId)

      // Update active item styling
      this.setActiveItem()

      // Update meta theme-color
      this.updateMetaThemeColor(themeId)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Update meta theme-color tag
   */
  private updateMetaThemeColor(themeId: ThemeIds): void {
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

// Register the custom element
if (!customElements.get('theme-picker')) {
  customElements.define('theme-picker', ThemePickerElement)
}
