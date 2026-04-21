/**
 * Bug Reporter Modal Element
 *
 * Implements a "Bring Your Own Widget" User Feedback modal for Sentry.
 * Uses `captureFeedback()` to send feedback while keeping UI fully site-owned.
 */

import { LitElement } from 'lit'
import { captureFeedback } from '@sentry/browser'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  getBugReporterCancelButtonElement,
  getBugReporterCloseButtonElement,
  getBugReporterDialogElement,
  getBugReporterFormElement,
  getBugReporterMinimizeButtonElement,
  getBugReporterMinimizedCloseButtonElement,
  getBugReporterMinimizedBarElement,
  getBugReporterRestoreButtonElement,
  getBugReporterStatusElement,
  getBugReporterTriggerElement,
  queryBugReporterNameInput,
  queryBugReporterSubmitButton,
} from './selectors'

const COMPONENT_TAG_NAME = 'bug-reporter-modal-element' as const

const openDialog = (dialog: HTMLDialogElement): void => {
  // JSDOM does not implement `showModal()`. In browsers, prefer it.
  if (typeof dialog.showModal === 'function') {
    dialog.showModal()
    return
  }

  dialog.setAttribute('open', '')
}

const closeDialog = (dialog: HTMLDialogElement): void => {
  if (typeof dialog.close === 'function') {
    dialog.close()
    return
  }

  dialog.removeAttribute('open')
}

export class BugReporterModalElement extends LitElement {
  static registeredName = COMPONENT_TAG_NAME

  static override properties = {
    triggerId: { type: String, attribute: 'trigger-id' },
    dialogId: { type: String, attribute: 'dialog-id' },
    statusId: { type: String, attribute: 'status-id' },
    formId: { type: String, attribute: 'form-id' },
    closeButtonId: { type: String, attribute: 'close-button-id' },
    cancelButtonId: { type: String, attribute: 'cancel-button-id' },
    minimizeButtonId: { type: String, attribute: 'minimize-button-id' },
    minimizedBarId: { type: String, attribute: 'minimized-bar-id' },
    minimizedRestoreButtonId: { type: String, attribute: 'minimized-restore-button-id' },
    minimizedCloseButtonId: { type: String, attribute: 'minimized-close-button-id' },
    open: { type: Boolean, reflect: true },
    minimized: { type: Boolean, reflect: true },
    statusMessage: { type: String, attribute: false },
    statusType: { type: String, attribute: false },
    isSubmitting: { type: Boolean, attribute: false },
  }

  declare triggerId: string
  declare dialogId: string
  declare statusId: string
  declare formId: string
  declare closeButtonId: string
  declare cancelButtonId: string
  declare minimizeButtonId: string
  declare minimizedBarId: string
  declare minimizedRestoreButtonId: string
  declare minimizedCloseButtonId: string
  declare open: boolean
  declare minimized: boolean
  declare statusMessage: string
  declare statusType: 'error' | 'success' | ''
  declare isSubmitting: boolean

  private triggerListenerAttached = false
  private closeListenerAttached = false
  private cancelListenerAttached = false
  private minimizeListenerAttached = false
  private minimizedBarListenerAttached = false
  private formListenerAttached = false
  private dialogListenerAttached = false
  /** Flag to distinguish minimize-triggered close from a real close. */
  private isMinimizing = false

  constructor() {
    super()
    this.triggerId = 'bugReporterTrigger'
    this.dialogId = 'bugReporterDialog'
    this.statusId = 'bugReporterStatus'
    this.formId = 'bugReporterForm'
    this.closeButtonId = 'bugReporterClose'
    this.cancelButtonId = 'bugReporterCancel'
    this.minimizeButtonId = 'bugReporterMinimize'
    this.minimizedBarId = 'bugReporterMinimizedBar'
    this.minimizedRestoreButtonId = 'bugReporterRestore'
    this.minimizedCloseButtonId = 'bugReporterMinimizedClose'
    this.open = false
    this.minimized = false
    this.statusMessage = ''
    this.statusType = ''
    this.isSubmitting = false
  }

  protected override createRenderRoot(): HTMLElement {
    // Light DOM rendering so existing site styles/utilities apply.
    return this
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.attachTriggerListener()
    this.attachCloseButtonListener()
    this.attachCancelButtonListener()
    this.attachMinimizeButtonListener()
    this.attachMinimizedBarListener()
    this.attachFormListener()
    this.attachDialogListener()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
  }

  protected override firstUpdated(): void {
    // No UI is rendered by this element; the modal markup is rendered by Astro.
    // Keep firstUpdated for parity with other components.
  }

  private attachTriggerListener(): void {
    const context = { scriptName: 'BugReporterModalElement', operation: 'attachTriggerListener' }
    addScriptBreadcrumb(context)

    try {
      if (this.triggerListenerAttached) {
        return
      }

      const trigger = getBugReporterTriggerElement(this.triggerId)
      if (!trigger) {
        return
      }

      addButtonEventListeners(trigger, this.handleTriggerClick, this)
      this.triggerListenerAttached = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private attachCloseButtonListener(): void {
    const context = {
      scriptName: 'BugReporterModalElement',
      operation: 'attachCloseButtonListener',
    }
    addScriptBreadcrumb(context)

    try {
      if (this.closeListenerAttached) {
        return
      }

      const closeButton = getBugReporterCloseButtonElement(this.closeButtonId)
      if (!closeButton) {
        return
      }

      addButtonEventListeners(closeButton, this.handleCloseClick, this)
      this.closeListenerAttached = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private attachCancelButtonListener(): void {
    const context = {
      scriptName: 'BugReporterModalElement',
      operation: 'attachCancelButtonListener',
    }
    addScriptBreadcrumb(context)

    try {
      if (this.cancelListenerAttached) {
        return
      }

      const cancelButton = getBugReporterCancelButtonElement(this.cancelButtonId)
      if (!cancelButton) {
        return
      }

      addButtonEventListeners(cancelButton, this.handleCancelClick, this)
      this.cancelListenerAttached = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private attachMinimizeButtonListener(): void {
    const context = {
      scriptName: 'BugReporterModalElement',
      operation: 'attachMinimizeButtonListener',
    }
    addScriptBreadcrumb(context)

    try {
      if (this.minimizeListenerAttached) {
        return
      }

      const minimizeButton = getBugReporterMinimizeButtonElement(this.minimizeButtonId)
      if (!minimizeButton) {
        return
      }

      addButtonEventListeners(minimizeButton, this.handleMinimizeClick, this)
      this.minimizeListenerAttached = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private attachMinimizedBarListener(): void {
    const context = {
      scriptName: 'BugReporterModalElement',
      operation: 'attachMinimizedBarListener',
    }
    addScriptBreadcrumb(context)

    try {
      if (this.minimizedBarListenerAttached) {
        return
      }

      const bar = getBugReporterMinimizedBarElement(this.minimizedBarId)
      if (!bar) {
        return
      }

      const restoreButton = getBugReporterRestoreButtonElement(this.minimizedRestoreButtonId)
      const closeButton = getBugReporterMinimizedCloseButtonElement(this.minimizedCloseButtonId)

      if (!restoreButton || !closeButton) {
        return
      }

      addButtonEventListeners(restoreButton, this.handleRestoreClick, this)
      addButtonEventListeners(closeButton, this.handleMinimizedCloseClick, this)

      this.minimizedBarListenerAttached = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private attachFormListener(): void {
    const context = { scriptName: 'BugReporterModalElement', operation: 'attachFormListener' }
    addScriptBreadcrumb(context)

    try {
      if (this.formListenerAttached) {
        return
      }

      const form = getBugReporterFormElement(this.formId)
      if (!form) {
        return
      }

      form.addEventListener('submit', event => {
        void this.handleSubmit(event)
      })
      this.formListenerAttached = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private attachDialogListener(): void {
    const context = { scriptName: 'BugReporterModalElement', operation: 'attachDialogListener' }
    addScriptBreadcrumb(context)

    try {
      if (this.dialogListenerAttached) {
        return
      }

      const dialog = getBugReporterDialogElement(this.dialogId)
      dialog.addEventListener('close', () => {
        // When minimizing, the dialog is closed to remove the backdrop but
        // form state should be preserved. Skip the reset in that case.
        if (this.isMinimizing) {
          this.isMinimizing = false
          return
        }

        this.open = false
        this.minimized = false
        this.isSubmitting = false
        this.statusMessage = ''
        this.statusType = ''
        this.resetForm()
        this.syncUiState()
      })

      this.dialogListenerAttached = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private readonly handleTriggerClick = (_event: Event): void => {
    this.openModal()
  }

  private readonly handleCloseClick = (_event: Event): void => {
    this.closeModal()
  }

  private readonly handleCancelClick = (_event: Event): void => {
    this.closeModal()
  }

  private readonly handleMinimizeClick = (_event: Event): void => {
    this.minimizeModal()
  }

  private readonly handleRestoreClick = (_event: Event): void => {
    this.restoreModal()
  }

  private readonly handleMinimizedCloseClick = (_event: Event): void => {
    this.closeFromMinimized()
  }

  private showStatus(message: string, type: 'error' | 'success' = 'error'): void {
    this.statusMessage = message
    this.statusType = type
    this.syncUiState()
  }

  private syncUiState(): void {
    const statusElement = getBugReporterStatusElement(this.statusId)
    if (statusElement) {
      statusElement.textContent = this.statusMessage
      statusElement.classList.toggle('hidden', !this.statusMessage)
      statusElement.classList.toggle('font-bold', this.statusType === 'error')
    }

    const submitButton = queryBugReporterSubmitButton(this.formId)
    if (!submitButton) {
      return
    }

    submitButton.disabled = this.isSubmitting
    submitButton.textContent = this.isSubmitting ? 'Sending…' : 'Send'
  }

  public openModal(): void {
    const context = { scriptName: 'BugReporterModalElement', operation: 'openModal' }
    addScriptBreadcrumb(context)

    try {
      // If currently minimized, restore without resetting form state
      if (this.minimized) {
        this.restoreModal()
        return
      }

      const dialog = getBugReporterDialogElement(this.dialogId)

      this.open = true
      this.minimized = false
      this.isSubmitting = false
      this.statusMessage = ''
      this.statusType = ''
      this.syncUiState()

      openDialog(dialog)

      queueMicrotask(() => {
        queryBugReporterNameInput(this.formId)?.focus()
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private closeModal(): void {
    const context = { scriptName: 'BugReporterModalElement', operation: 'closeModal' }
    addScriptBreadcrumb(context)

    try {
      this.open = false
      this.minimized = false
      this.isSubmitting = false
      this.statusMessage = ''
      this.statusType = ''
      this.resetForm()
      this.hideMinimizedBar()
      this.syncUiState()

      const dialog = getBugReporterDialogElement(this.dialogId)
      closeDialog(dialog)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private minimizeModal(): void {
    const context = { scriptName: 'BugReporterModalElement', operation: 'minimizeModal' }
    addScriptBreadcrumb(context)

    try {
      this.isMinimizing = true
      this.open = false
      this.minimized = true

      const dialog = getBugReporterDialogElement(this.dialogId)
      closeDialog(dialog)

      this.showMinimizedBar()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private restoreModal(): void {
    const context = { scriptName: 'BugReporterModalElement', operation: 'restoreModal' }
    addScriptBreadcrumb(context)

    try {
      this.minimized = false
      this.open = true
      this.hideMinimizedBar()

      const dialog = getBugReporterDialogElement(this.dialogId)
      openDialog(dialog)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /** Close from the minimized bar — resets form state since the user is dismissing entirely. */
  private closeFromMinimized(): void {
    const context = { scriptName: 'BugReporterModalElement', operation: 'closeFromMinimized' }
    addScriptBreadcrumb(context)

    try {
      this.open = false
      this.minimized = false
      this.isSubmitting = false
      this.statusMessage = ''
      this.statusType = ''
      this.resetForm()
      this.hideMinimizedBar()
      this.syncUiState()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private resetForm(): void {
    const form = getBugReporterFormElement(this.formId)
    if (form) {
      form.reset()
    }
  }

  private showMinimizedBar(): void {
    const bar = getBugReporterMinimizedBarElement(this.minimizedBarId)
    if (bar) {
      bar.classList.remove('hidden')
    }
  }

  private hideMinimizedBar(): void {
    const bar = getBugReporterMinimizedBarElement(this.minimizedBarId)
    if (bar) {
      bar.classList.add('hidden')
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault()
    const context = { scriptName: 'BugReporterModalElement', operation: 'handleSubmit' }
    addScriptBreadcrumb(context)

    try {
      if (!(event.target instanceof HTMLFormElement)) {
        this.showStatus('Unable to submit feedback. Please try again.')
        return
      }

      const formData = new FormData(event.target)
      const name = String(formData.get('name') ?? '').trim()
      const email = String(formData.get('email') ?? '').trim()
      const message = String(formData.get('message') ?? '').trim()

      if (!message) {
        this.showStatus('Please describe the issue.')
        return
      }

      this.isSubmitting = true
      this.syncUiState()

      // With `exactOptionalPropertyTypes`, omit optional keys entirely when empty.
      const feedback: { message: string; name?: string; email?: string } = { message }
      if (name) feedback.name = name
      if (email) feedback.email = email

      captureFeedback(feedback, {
        includeReplay: true,
        captureContext: {
          tags: {
            source: 'bug-reporter-modal',
          },
        },
      })

      this.isSubmitting = false
      this.showStatus('Thanks — your report was sent.', 'success')
      event.target.reset()
    } catch (error) {
      this.isSubmitting = false
      this.showStatus('Failed to send feedback. Please try again.')
      handleScriptError(error, context)
    }
  }

  protected override render() {
    return null
  }
}

export const registerWebComponent = async (tagName?: string) => {
  const resolvedTagName = tagName ?? BugReporterModalElement.registeredName
  defineCustomElement(resolvedTagName, BugReporterModalElement)
}

export const registerBugReporterWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<BugReporterModalElement> = {
  registeredName: BugReporterModalElement.registeredName,
  componentCtor: BugReporterModalElement,
  registerWebComponent,
}
