/**
 * Contact Form Handler
 * Manages form submission, validation, and user interactions for the contact form
 */

import { LitElement } from 'lit'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { getContactFormElements } from './selectors'
import type { ContactFormConfig } from './@types'
import { initCharacterCounter, initUploadPlaceholder } from './utils'
import { initLabelHandlers, type LabelController } from './feedback'
import { initEmailValidationHandler } from './email'
import { initFormSubmission } from './formSubmission'
import { initGenericValidation, initNameLengthHandler, initMssgLengthHandler } from './validation'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

const COMPONENT_TAG_NAME = 'contact-form' as const

export class ContactFormElement extends LitElement {
  private labelController: LabelController | null = null
  private viewTransitionHandlersRegistered = false
  private beforePreparationHandler: (() => void) | null = null
  private afterSwapHandler: (() => void) | null = null

  private config: ContactFormConfig = {
    maxCharacters: 2000,
    warningThreshold: 1500,
    errorThreshold: 1800,
    apiEndpoint: '/api/contact',
  }

  override createRenderRoot() {
    return this
  }

  override connectedCallback() {
    super.connectedCallback()
    this.initialize()
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.removeViewTransitionsHandlers()
  }

  private initialize(): void {
    const context = { scriptName: 'ContactFormElement', operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      const elements = getContactFormElements()
      this.labelController = initLabelHandlers(elements.fields)
      initCharacterCounter(elements, this.config)
      initUploadPlaceholder(elements)
      initEmailValidationHandler(elements.fields.email)
      initNameLengthHandler(elements.fields.name)
      initMssgLengthHandler(elements.fields.message)
      initGenericValidation(elements.form)
      initFormSubmission(elements, this.config, {
        labelController: this.labelController,
      })
      this.setViewTransitionsHandlers()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setViewTransitionsHandlers(): void {
    if (this.viewTransitionHandlersRegistered) {
      return
    }

    this.beforePreparationHandler = () => {
      ContactFormElement.handleBeforePreparation()
    }

    this.afterSwapHandler = () => {
      this.initialize()
    }

    document.addEventListener('astro:before-preparation', this.beforePreparationHandler)
    document.addEventListener('astro:after-swap', this.afterSwapHandler)

    this.viewTransitionHandlersRegistered = true
  }

  private removeViewTransitionsHandlers(): void {
    if (this.beforePreparationHandler) {
      document.removeEventListener('astro:before-preparation', this.beforePreparationHandler)
      this.beforePreparationHandler = null
    }

    if (this.afterSwapHandler) {
      document.removeEventListener('astro:after-swap', this.afterSwapHandler)
      this.afterSwapHandler = null
    }

    this.viewTransitionHandlersRegistered = false
  }

  private static handleBeforePreparation(): void {
    // Reserved for cleanup prior to Astro View Transitions swapping content
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'contact-form': ContactFormElement
  }
}

export const registerContactFormWebComponent = (tagName: string = COMPONENT_TAG_NAME) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, ContactFormElement)
}

export const webComponentModule: WebComponentModule<ContactFormElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: ContactFormElement,
  registerWebComponent: registerContactFormWebComponent,
}
