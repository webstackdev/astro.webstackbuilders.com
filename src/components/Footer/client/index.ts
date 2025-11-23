/**
 * Footer web component
 * Updates the "Hire Me" CTA text once connected
 */
import { LitElement } from 'lit'
import { getHireMeAnchorElement } from '@components/Footer/client/selectors'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

const SCRIPT_NAME = 'FooterElement'

export class FooterElement extends LitElement {
  private hireMeAnchor: HTMLAnchorElement | null = null

  override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.initialize()
  }

  private initialize(): void {
    const context = { scriptName: SCRIPT_NAME, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      if (!this.hireMeAnchor) {
        this.hireMeAnchor = getHireMeAnchorElement(this)
      }

      this.updateHireMeCopy()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private updateHireMeCopy(): void {
    if (!this.hireMeAnchor) {
      return
    }

    const date = new Date()
    const month = FooterElement.getMonthName(date)
    const year = date.getFullYear()

    this.hireMeAnchor.innerHTML = `Available ${month}, ${year}. Hire Me Now`
    this.hireMeAnchor.style.display = 'inline-block'
  }

  private static getMonthName(date: Date): string {
    const monthDate = new Date(date)
    monthDate.setMonth(monthDate.getMonth() - 1)
    return monthDate.toLocaleString('en-US', { month: 'long' })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'site-footer': FooterElement
  }
}

export const registerFooterWebComponent = (tagName = 'site-footer') => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, FooterElement)
}

export const webComponentModule: WebComponentModule<FooterElement> = {
  registeredName: 'site-footer',
  componentCtor: FooterElement,
  registerWebComponent: registerFooterWebComponent,
}
