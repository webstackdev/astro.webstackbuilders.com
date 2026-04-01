import { LitElement } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { addWrapperEventListeners } from '@components/scripts/elementListeners'
import {
  getTooltipElements,
  queryTooltipFocusableDescendant,
  queryTooltipUpgradeCandidates,
} from './selectors'

const TOOLTIP_HOST_CLASSES = 'relative inline-flex'
const TOOLTIP_TRIGGER_CLASSES =
  'inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spotlight'
const TOOLTIP_POPUP_CLASSES =
  'pointer-events-none absolute left-0 top-full z-(--z-content-floating) mt-2 hidden max-w-64 rounded-md border border-trim bg-page-inverse px-2 py-1 text-sm leading-tight text-page-base shadow-elevated'

let tooltipIdCounter = 0
let pageLoadListenerAttached = false

/**
 * Tooltip web component that toggles server-rendered tooltip markup.
 */
export class TooltipElement extends LitElement {
  static registeredName = 'site-tooltip'

  static override properties = {
    open: { type: Boolean, reflect: true },
  }

  declare open: boolean

  private trigger: HTMLSpanElement | null = null
  private tooltip: HTMLSpanElement | null = null

  constructor() {
    super()
    this.open = false
  }

  protected override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.cacheElements()
    this.initializeAccessibility()
    this.attachListeners()
    this.syncState()
  }

  override disconnectedCallback(): void {
    this.detachListeners()
    super.disconnectedCallback()
  }

  protected override updated(): void {
    this.syncState()
  }

  private cacheElements(): void {
    const { trigger, tooltip } = getTooltipElements(this)
    this.trigger = trigger
    this.tooltip = tooltip
  }

  private initializeAccessibility(): void {
    if (!this.trigger || !this.tooltip) {
      return
    }

    if (!this.tooltip.id) {
      this.tooltip.id = createTooltipId()
    }

    this.trigger.setAttribute('aria-describedby', this.tooltip.id)

    const focusableDescendant = queryTooltipFocusableDescendant(this.trigger)
    if (focusableDescendant) {
      this.trigger.removeAttribute('tabindex')
      return
    }

    this.trigger.tabIndex = 0
  }

  private attachListeners(): void {
    this.trigger?.addEventListener('mouseenter', this.handleOpen)
    this.trigger?.addEventListener('mouseleave', this.handleClose)
    this.trigger?.addEventListener('focusin', this.handleOpen)
    this.trigger?.addEventListener('focusout', this.handleFocusOut)

    if (this.trigger && !this.trigger.dataset['tooltipEscapeListener']) {
      addWrapperEventListeners(this.trigger, this.handleKeyUp, this, {
        allowedKeys: ['Escape'],
      })
      this.trigger.dataset['tooltipEscapeListener'] = 'true'
    }
  }

  private detachListeners(): void {
    this.trigger?.removeEventListener('mouseenter', this.handleOpen)
    this.trigger?.removeEventListener('mouseleave', this.handleClose)
    this.trigger?.removeEventListener('focusin', this.handleOpen)
    this.trigger?.removeEventListener('focusout', this.handleFocusOut)
  }

  private syncState(): void {
    if (!this.tooltip) {
      return
    }

    this.tooltip.classList.toggle('hidden', !this.open)
    this.tooltip.setAttribute('aria-hidden', String(!this.open))
    this.toggleAttribute('data-open', this.open)
  }

  private readonly handleOpen = (): void => {
    this.open = true
  }

  private readonly handleClose = (): void => {
    this.open = false
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const relatedTarget = event.relatedTarget
    if (relatedTarget instanceof Node && this.contains(relatedTarget)) {
      return
    }

    this.open = false
  }

  private readonly handleKeyUp = (event: Event): void => {
    if (!('key' in event) || typeof event.key !== 'string') {
      return
    }

    if (event.key === 'Escape') {
      this.open = false
    }
  }
}

const createTooltipId = (): string => {
  tooltipIdCounter += 1
  return `site-tooltip-${tooltipIdCounter}`
}

const createTriggerElement = (document: Document): HTMLSpanElement => {
  const trigger = document.createElement('span')
  trigger.setAttribute('data-tooltip-trigger', '')
  trigger.className = TOOLTIP_TRIGGER_CLASSES
  return trigger
}

const createTooltipPopupElement = (document: Document, text: string): HTMLSpanElement => {
  const tooltip = document.createElement('span')
  tooltip.setAttribute('data-tooltip-popup', '')
  tooltip.setAttribute('role', 'tooltip')
  tooltip.setAttribute('aria-hidden', 'true')
  tooltip.className = TOOLTIP_POPUP_CLASSES
  tooltip.textContent = text
  return tooltip
}

const upgradeTooltipCandidate = (element: HTMLElement): TooltipElement | null => {
  const title = element.getAttribute('title')?.trim()
  if (!title || !element.parentNode) {
    return null
  }

  const document = element.ownerDocument
  const parentNode = element.parentNode
  const nextSibling = element.nextSibling
  const wrapper = document.createElement(TooltipElement.registeredName) as TooltipElement
  wrapper.className = TOOLTIP_HOST_CLASSES

  const trigger = createTriggerElement(document)
  const tooltip = createTooltipPopupElement(document, title)

  element.removeAttribute('title')

  trigger.append(element)
  wrapper.append(trigger, tooltip)
  parentNode.insertBefore(wrapper, nextSibling)

  return wrapper
}

export const enhanceTooltipElements = (root: ParentNode = document): TooltipElement[] => {
  return queryTooltipUpgradeCandidates(root)
    .map(element => upgradeTooltipCandidate(element))
    .filter((element): element is TooltipElement => element instanceof TooltipElement)
}

const registerPageLoadListener = (): void => {
  if (pageLoadListenerAttached || typeof document === 'undefined') {
    return
  }

  document.addEventListener('astro:page-load', () => {
    enhanceTooltipElements(document)
  })

  pageLoadListenerAttached = true
}

declare global {
  interface HTMLElementTagNameMap {
    'site-tooltip': TooltipElement
  }
}

/**
 * Registers the tooltip custom element.
 */
export const registerWebComponent = (tagName = TooltipElement.registeredName) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, TooltipElement)
  enhanceTooltipElements(document)
  registerPageLoadListener()
}

export const registerTooltipWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<TooltipElement> = {
  registeredName: TooltipElement.registeredName,
  componentCtor: TooltipElement,
  registerWebComponent,
}
