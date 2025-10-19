/**
 * Mastodon Share Modal - LoadableScript Implementation
 *
 * Provides a modal interface for sharing content to Mastodon instances.
 * Handles instance detection, validation, and saved instance management.
 *
 * SPDX-FileCopyrightText: © 2025 Kevin Brown <kevin@webstackbuilders.com>
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createFocusTrap, type FocusTrap } from 'focus-trap'
import { LoadableScript, type TriggerEvent } from '@components/Scripts/loader/@types/loader'
import { isMastodonInstance, normalizeURL, getUrlDomain } from './detector'
import { buildShareUrl } from './config'
import {
  $currentMastodonInstance,
  $mastodonInstances,
  saveMastodonInstance,
} from '@components/Scripts/state'
import {
  getModalElement,
  getBackdropElement,
  getCloseButtonElement,
  getCancelButtonElement,
  getFormElement,
  getShareTextElement,
  getInstanceInputElement,
  getRememberCheckboxElement,
  getSubmitButtonElement,
  getStatusElement,
  getSavedInstancesContainer,
  getSavedInstancesList,
} from './selectors'

/**
 * Custom event detail for modal open
 */
interface MastodonModalOpenDetail {
  text: string
}

/**
 * Custom event detail for share
 */
interface MastodonShareDetail {
  instance: string
  text: string
  url: string
}

/**
 * Declare custom events on Window
 */
declare global {
  interface WindowEventMap {
    'mastodon:modal-open': CustomEvent<MastodonModalOpenDetail>
    'mastodon:modal-close': CustomEvent<void>
    'mastodon:share': CustomEvent<MastodonShareDetail>
    'mastodon:open-modal': CustomEvent<MastodonModalOpenDetail>
  }
}

/**
 * MastodonModal - Main controller for the Mastodon share modal
 */
export class MastodonModal extends LoadableScript {
  static override scriptName = 'MastodonModal'
  static override eventType: TriggerEvent = 'astro:page-load'

  private static instance: MastodonModal | null = null

  // DOM elements
  private modal: HTMLDivElement | null = null
  private backdrop: HTMLDivElement | null = null
  private closeButton: HTMLButtonElement | null = null
  private cancelButton: HTMLButtonElement | null = null
  private form: HTMLFormElement | null = null
  private textarea: HTMLTextAreaElement | null = null
  private instanceInput: HTMLInputElement | null = null
  private rememberCheckbox: HTMLInputElement | null = null
  private submitButton: HTMLButtonElement | null = null
  private statusElement: HTMLParagraphElement | null = null
  private savedInstancesContainer: HTMLDivElement | null = null
  private savedInstancesList: HTMLDivElement | null = null

  // State
  private focusTrap: FocusTrap | null = null
  private shareText = ''
  private unsubscribeSavedInstances: (() => void) | null = null

  constructor() {
    super()
  }

  /**
   * Initialize the modal and set up event listeners
   */
  bindEvents(): void {
    try {
      // Get DOM elements using type-safe selectors
      this.modal = getModalElement()
      this.backdrop = getBackdropElement(this.modal)
      this.closeButton = getCloseButtonElement(this.modal)
      this.cancelButton = getCancelButtonElement(this.modal)
      this.form = getFormElement(this.modal)
      this.textarea = getShareTextElement(this.modal)
      this.instanceInput = getInstanceInputElement(this.modal)
      this.rememberCheckbox = getRememberCheckboxElement(this.modal)
      this.submitButton = getSubmitButtonElement(this.form)
      this.statusElement = getStatusElement(this.modal)
      this.savedInstancesContainer = getSavedInstancesContainer(this.modal)
      this.savedInstancesList = getSavedInstancesList(this.modal)

      // Initialize focus trap
      this.focusTrap = createFocusTrap(this.modal, {
        escapeDeactivates: true,
        clickOutsideDeactivates: true,
        onDeactivate: () => this.closeModal(),
      })

      // Set up event listeners
      this.closeButton.addEventListener('click', () => this.closeModal())
      this.cancelButton.addEventListener('click', () => this.closeModal())
      this.backdrop.addEventListener('click', () => this.closeModal())
      this.form.addEventListener('submit', (e) => this.handleSubmit(e))

      // Listen for ESC key
      document.addEventListener('keydown', this.handleKeyDown)

      // Listen for custom event to open modal
      window.addEventListener('mastodon:open-modal', this.handleOpenModalEvent)

      // Subscribe to saved instances changes
      this.unsubscribeSavedInstances = $mastodonInstances.subscribe((instances) => {
        this.updateSavedInstancesUI(instances)
      })
    } catch (error) {
      console.error('Failed to initialize Mastodon modal:', error)
    }
  }

  /**
   * Handle keydown events (ESC to close)
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !this.modal?.hasAttribute('hidden')) {
      this.closeModal()
    }
  }

  /**
   * Handle custom event to open modal
   */
  private handleOpenModalEvent = (event: CustomEvent<MastodonModalOpenDetail>): void => {
    this.openModal(event.detail.text)
  }

  /**
   * Update saved instances UI
   */
  private updateSavedInstancesUI(instances: Set<string>): void {
    if (!this.savedInstancesContainer || !this.savedInstancesList || !this.instanceInput) {
      return
    }

    if (instances.size === 0) {
      this.savedInstancesContainer.style.display = 'none'
      return
    }

    this.savedInstancesContainer.style.display = 'flex'
    const savedArray = [...instances]

    // Pre-fill first instance if input is empty
    if (!this.instanceInput.value && savedArray.length > 0) {
      const firstInstance = savedArray[0]
      if (firstInstance) {
        this.instanceInput.value = firstInstance
      }
    }

    // Create clickable instance buttons
    this.savedInstancesList.replaceChildren(
      ...savedArray.map((instance) => {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'saved-instance'
        button.textContent = instance
        button.addEventListener('click', () => {
          if (this.instanceInput) {
            this.instanceInput.value = instance
            this.instanceInput.focus()
          }
        })
        return button
      })
    )
  }

  /**
   * Opens the modal with the given share text
   */
  private openModal(text: string): void {
    this.shareText = text

    if (this.textarea) {
      this.textarea.value = text
    }

    // Restore last used instance
    const lastInstance = $currentMastodonInstance.get()
    if (lastInstance && this.instanceInput) {
      this.instanceInput.value = lastInstance
    }

    this.modal?.removeAttribute('hidden')
    this.focusTrap?.activate()

    // Emit custom event for analytics
    window.dispatchEvent(
      new CustomEvent('mastodon:modal-open', {
        detail: { text },
      })
    )
  }

  /**
   * Closes the modal and deactivates focus trap
   */
  private closeModal(): void {
    this.modal?.setAttribute('hidden', '')
    this.focusTrap?.deactivate()
    this.resetForm()

    // Emit custom event for analytics
    window.dispatchEvent(new CustomEvent('mastodon:modal-close'))
  }

  /**
   * Resets the form to initial state
   */
  private resetForm(): void {
    if (this.form) {
      this.form.reset()
    }
    if (this.statusElement) {
      this.statusElement.textContent = ''
      this.statusElement.className = 'modal-status'
    }
    if (this.submitButton) {
      this.submitButton.disabled = false
    }
  }

  /**
   * Shows a status message to the user
   */
  private showStatus(message: string, type: 'error' | 'success' = 'error'): void {
    if (this.statusElement) {
      this.statusElement.textContent = message
      this.statusElement.className = `modal-status ${type}`
    }
  }

  /**
   * Handles form submission and shares to Mastodon
   */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault()

    const instance = this.instanceInput?.value?.trim()
    if (!instance) {
      this.showStatus('Please enter a Mastodon instance')
      return
    }

    if (this.submitButton) {
      this.submitButton.disabled = true
    }
    this.showStatus('Detecting instance...', 'success')

    try {
      // Verify it's a Mastodon instance
      const isMastodon = await isMastodonInstance(instance)
      if (!isMastodon) {
        this.showStatus('This does not appear to be a Mastodon instance')
        if (this.submitButton) {
          this.submitButton.disabled = false
        }
        return
      }

      // Save instance if remember is checked
      const remember = this.rememberCheckbox?.checked || false
      if (remember) {
        const domain = getUrlDomain(normalizeURL(instance))
        saveMastodonInstance(domain)
      }

      // Store current instance
      $currentMastodonInstance.set(instance)

      // Build share URL and redirect
      const shareUrl = buildShareUrl(instance, this.shareText)

      // Emit custom event for analytics
      window.dispatchEvent(
        new CustomEvent('mastodon:share', {
          detail: { instance, text: this.shareText, url: shareUrl },
        })
      )

      // Open in new tab
      window.open(shareUrl, '_blank', 'noopener,noreferrer')

      // Close modal after short delay
      this.showStatus('Opening Mastodon...', 'success')
      setTimeout(() => this.closeModal(), 1000)
    } catch (error) {
      console.error('Mastodon share error:', error)
      this.showStatus('Failed to verify instance. Please try again.')
      if (this.submitButton) {
        this.submitButton.disabled = false
      }
    }
  }

  /**
   * Pause the script (remove event listeners)
   */
  pause(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('mastodon:open-modal', this.handleOpenModalEvent)

    if (this.closeButton) {
      this.closeButton.removeEventListener('click', () => this.closeModal())
    }
    if (this.cancelButton) {
      this.cancelButton.removeEventListener('click', () => this.closeModal())
    }
    if (this.backdrop) {
      this.backdrop.removeEventListener('click', () => this.closeModal())
    }
    if (this.form) {
      this.form.removeEventListener('submit', (e) => this.handleSubmit(e))
    }
  }

  /**
   * Resume the script (re-add event listeners)
   */
  resume(): void {
    this.bindEvents()
  }

  /**
   * LoadableScript static methods
   */
  static override init(): void {
    MastodonModal.instance = new MastodonModal()
    MastodonModal.instance.bindEvents()
  }

  static override pause(): void {
    if (MastodonModal.instance) {
      MastodonModal.instance.pause()
    }
  }

  static override resume(): void {
    if (MastodonModal.instance) {
      MastodonModal.instance.resume()
    }
  }

  static override reset(): void {
    if (MastodonModal.instance) {
      MastodonModal.instance.pause()
      if (MastodonModal.instance.unsubscribeSavedInstances) {
        MastodonModal.instance.unsubscribeSavedInstances()
      }
      MastodonModal.instance = null
    }
  }

  /**
   * Public API to open modal
   * Can be called from other scripts
   */
  static openModal(text: string): void {
    if (MastodonModal.instance) {
      MastodonModal.instance.openModal(text)
    } else {
      // If not initialized, dispatch event that will be handled once initialized
      window.dispatchEvent(
        new CustomEvent('mastodon:open-modal', {
          detail: { text },
        })
      )
    }
  }
}
