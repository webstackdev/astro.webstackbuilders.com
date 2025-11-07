import { LitElement } from 'lit'
import { StoreController } from '@nanostores/lit'
import { $theme, $themePickerOpen, setTheme, type ThemeId } from '@components/scripts/store'

/**
 * Lit-based controller for ThemePicker
 * Uses existing Astro-rendered DOM (Light DOM), just adds reactive behavior
 */
export class ThemePickerController extends LitElement {
  // Render to Light DOM instead of Shadow DOM
  createRenderRoot() {
    return this // This is the key - no shadow DOM!
  }

  // Reactive store bindings
  private themePickerOpen = new StoreController(this, $themePickerOpen)
  private theme = new StoreController(this, $theme)

  // Cache DOM elements
  private pickerModal!: HTMLDivElement
  private toggleBtn!: HTMLButtonElement
  private closeBtn!: HTMLButtonElement
  private themeSelectBtns!: NodeListOf<HTMLButtonElement>

  firstUpdated() {
    // Find elements in Light DOM (rendered by Astro)
    this.pickerModal = this.querySelector('[data-theme-modal]')!
    this.toggleBtn = document.querySelector('[data-theme-toggle]')!
    this.closeBtn = this.querySelector('[data-theme-close]')!
    this.themeSelectBtns = this.querySelectorAll('[data-theme]')!

    // Bind event handlers
    this.toggleBtn.addEventListener('click', () => this.handleToggle())
    this.closeBtn.addEventListener('click', () => this.handleClose())

    this.themeSelectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = btn.dataset.theme as ThemeId
        setTheme(themeId)
      })
    })
  }

  // Lit's reactive update cycle handles store changes
  updated() {
    const isOpen = this.themePickerOpen.value
    const currentTheme = this.theme.value

    // Update modal visibility
    if (isOpen) {
      this.pickerModal.removeAttribute('hidden')
      this.pickerModal.classList.add('is-open')
      this.toggleBtn.setAttribute('aria-expanded', 'true')
    } else {
      this.pickerModal.classList.remove('is-open')
      this.toggleBtn.setAttribute('aria-expanded', 'false')
      setTimeout(() => {
        if (!this.themePickerOpen.value) {
          this.pickerModal.setAttribute('hidden', '')
        }
      }, 400) // Match CSS transition duration
    }

    // Update active theme button
    this.themeSelectBtns.forEach(btn => {
      if (btn.dataset.theme === currentTheme) {
        btn.parentElement?.classList.add('is-active')
      } else {
        btn.parentElement?.classList.remove('is-active')
      }
    })
  }

  private handleToggle() {
    $themePickerOpen.set(!this.themePickerOpen.value)
  }

  private handleClose() {
    $themePickerOpen.set(false)
  }

  // No render() method needed - Astro already rendered the DOM!
}

customElements.define('theme-picker', ThemePickerController)
