/**
 * Newsletter Confirm Web Component (Lit-based)
 * Handles double opt-in confirmation link from email
 */

import { LitElement } from 'lit'
import { actions } from 'astro:actions'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { getNewsletterConfirmElements } from './selectors'

type ConfirmActionData = {
  success?: boolean
  email?: string
  status?: string
  message?: string
}

/**
 * Newsletter confirmation custom element.
 * Uses Light DOM (no Shadow DOM) with Astro-rendered templates.
 */
export class NewsletterConfirmElement extends LitElement {
  static readonly registeredName = 'newsletter-confirm'

  override createRenderRoot() {
    return this
  }

  private isInitialized = false

  private loadingState!: HTMLDivElement
  private successState!: HTMLDivElement
  private expiredState!: HTMLDivElement
  private errorState!: HTMLDivElement
  private statusAnnouncer!: HTMLElement
  private userEmail!: HTMLElement
  private errorTitle!: HTMLElement
  private errorMessage!: HTMLElement
  private errorDetails!: HTMLElement
  private successHeading!: HTMLElement
  private expiredHeading!: HTMLElement
  private loadingHeading!: HTMLElement

  override connectedCallback(): void {
    super.connectedCallback()

    const context = { scriptName: 'NewsletterConfirmElement', operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    const scheduleInitialization = () => {
      queueMicrotask(() => this.initialize())
    }

    if (document.readyState === 'loading') {
      const handleDomReady = () => {
        document.removeEventListener('DOMContentLoaded', handleDomReady)
        scheduleInitialization()
      }
      document.addEventListener('DOMContentLoaded', handleDomReady)
    } else {
      scheduleInitialization()
    }
  }

  /**
   * Initialize the newsletter confirmation after DOM is ready.
   * Public for testing purposes.
   */
  public initialize(): void {
    const context = { scriptName: 'NewsletterConfirmElement', operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      if (this.isInitialized) return
      this.findElements()
      this.isInitialized = true

      void this.confirmSubscription()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private findElements(): void {
    const context = { scriptName: 'NewsletterConfirmElement', operation: 'findElements' }
    addScriptBreadcrumb(context)

    try {
      const elements = getNewsletterConfirmElements(this)
      this.loadingState = elements.loadingState
      this.successState = elements.successState
      this.expiredState = elements.expiredState
      this.errorState = elements.errorState
      this.statusAnnouncer = elements.statusAnnouncer
      this.userEmail = elements.userEmail
      this.errorTitle = elements.errorTitle
      this.errorMessage = elements.errorMessage
      this.errorDetails = elements.errorDetails
      this.successHeading = elements.successHeading
      this.expiredHeading = elements.expiredHeading
      this.loadingHeading = elements.loadingHeading
    } catch (error) {
      if (error instanceof ClientScriptError) {
        throw error
      }
      throw new ClientScriptError(
        `NewsletterConfirmElement: Failed to find elements - ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private announceStatus(message: string): void {
    this.statusAnnouncer.textContent = message
  }

  private focusHeading(heading: HTMLElement): void {
    heading.focus()
  }

  private hideAllStates(): void {
    this.loadingState.classList.add('hidden')
    this.successState.classList.add('hidden')
    this.expiredState.classList.add('hidden')
    this.errorState.classList.add('hidden')
  }

  private showLoading(): void {
    this.hideAllStates()
    this.loadingState.classList.remove('hidden')
    this.announceStatus('Confirming subscription.')
    this.focusHeading(this.loadingHeading)
  }

  private showSuccess(email: string): void {
    this.hideAllStates()
    this.userEmail.textContent = email
    this.successState.classList.remove('hidden')
    this.announceStatus('Subscription confirmed.')
    this.focusHeading(this.successHeading)
  }

  private showExpired(): void {
    this.hideAllStates()
    this.expiredState.classList.remove('hidden')
    this.announceStatus('Confirmation link expired.')
    this.focusHeading(this.expiredHeading)
  }

  private showError(title: string, message: string, details?: string): void {
    this.hideAllStates()
    this.errorTitle.textContent = title
    this.errorMessage.textContent = message

    if (details) {
      this.errorDetails.textContent = `Error details: ${details}`
      this.errorDetails.classList.remove('hidden')
    } else {
      this.errorDetails.classList.add('hidden')
      this.errorDetails.textContent = ''
    }

    this.errorState.classList.remove('hidden')
    this.announceStatus(title)
    this.focusHeading(this.errorTitle)
  }

  private resolveToken(): string {
    const tokenFromAttribute = this.getAttribute('token')
    if (typeof tokenFromAttribute === 'string' && tokenFromAttribute.trim().length > 0) {
      return tokenFromAttribute
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean)
    const token = pathParts[pathParts.length - 1]
    return token ?? ''
  }

  private async confirmSubscription(): Promise<void> {
    const context = { scriptName: 'NewsletterConfirmElement', operation: 'confirmSubscription' }
    addScriptBreadcrumb(context)

    const token = this.resolveToken()
    if (!token) {
      this.showError('Invalid Link', 'This confirmation link is invalid or malformed.')
      return
    }

    this.showLoading()

    try {
      const { data, error } = await actions.newsletter.confirm({ token })

      if (error) {
        this.showError(
          'Confirmation Error',
          error.message || 'An error occurred while confirming your subscription.'
        )
        return
      }

      const resultData = data as ConfirmActionData
      if (resultData.success) {
        this.showSuccess(resultData.email || 'your email')
        return
      }

      if (resultData.status === 'expired') {
        this.showExpired()
        return
      }

      this.showError(
        'Confirmation Error',
        resultData.message || 'An error occurred while confirming your subscription.'
      )
    } catch (error) {
      this.showError(
        'Confirmation Error',
        'An error occurred while confirming your subscription.',
        error instanceof Error ? error.message : 'Network or server error'
      )
    }
  }
}

export const registerWebComponent = async (
  tagName = NewsletterConfirmElement.registeredName
): Promise<void> => {
  defineCustomElement(tagName, NewsletterConfirmElement)
}

export const registerNewsletterConfirm = registerWebComponent

export const webComponentModule: WebComponentModule<NewsletterConfirmElement> = {
  registeredName: NewsletterConfirmElement.registeredName,
  componentCtor: NewsletterConfirmElement,
  registerWebComponent,
}
