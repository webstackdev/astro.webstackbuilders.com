import { LitElement } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { addWrapperEventListeners } from '@components/scripts/elementListeners'
import {
  getTooltipElements,
  hasTooltipElements,
  queryTooltipFocusableDescendant,
  queryTooltipUpgradeCandidates,
} from './selectors'

const TOOLTIP_HOST_CLASSES = 'relative inline-flex'
const TOOLTIP_TRIGGER_CLASSES =
  'inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spotlight'
const TOOLTIP_POPUP_CLASSES =
  'pointer-events-none absolute left-0 top-full z-(--z-content-floating) mt-2 hidden max-w-64 rounded-md border border-trim bg-page-inverse px-2 py-1 text-sm leading-tight text-page-base shadow-elevated whitespace-nowrap'

let tooltipIdCounter = 0
let pageLoadListenerAttached = false

const scheduleMicrotask = (callback: () => void): void => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback)
    return
  }

  void Promise.resolve().then(callback)
}

export const initializeTooltipHost = (
  host: HTMLElement
): {
  trigger: HTMLSpanElement
  tooltip: HTMLSpanElement
} => {
  const { trigger, tooltip } = getTooltipElements(host)

  if (!tooltip.id) {
    tooltip.id = createTooltipId()
  }

  trigger.setAttribute('aria-describedby', tooltip.id)

  const focusableDescendant = queryTooltipFocusableDescendant(trigger)
  if (focusableDescendant) {
    trigger.removeAttribute('tabindex')
  } else {
    trigger.tabIndex = 0
  }

  const syncState = (isOpen: boolean): void => {
    tooltip.classList.toggle('hidden', !isOpen)
    tooltip.setAttribute('aria-hidden', String(!isOpen))
    host.toggleAttribute('data-open', isOpen)
  }

  const handleOpen = (): void => {
    syncState(true)
  }

  const handleClose = (): void => {
    syncState(false)
  }

  const handleFocusOut = (event: FocusEvent): void => {
    const relatedTarget = event.relatedTarget
    if (relatedTarget instanceof Node && host.contains(relatedTarget)) {
      return
    }

    syncState(false)
  }

  const handleKeyUp = (event: Event): void => {
    if ('key' in event && typeof event.key === 'string' && event.key === 'Escape') {
      syncState(false)
    }
  }

  if (!trigger.dataset['tooltipOpenListeners']) {
    trigger.addEventListener('mouseenter', handleOpen)
    trigger.addEventListener('mouseleave', handleClose)
    trigger.addEventListener('focusin', handleOpen)
    trigger.addEventListener('focusout', handleFocusOut)
    trigger.dataset['tooltipOpenListeners'] = 'true'
  }

  if (!trigger.dataset['tooltipEscapeListener']) {
    addWrapperEventListeners(trigger, handleKeyUp, host, {
      allowedKeys: ['Escape'],
    })
    trigger.dataset['tooltipEscapeListener'] = 'true'
  }

  syncState(host.hasAttribute('data-open'))

  return { trigger, tooltip }
}

/**
 * Tooltip web component that toggles server-rendered tooltip markup.
 */
export class TooltipElement extends LitElement {
  static registeredName = 'site-tooltip'

  private isInitialized = false

  protected override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.initializeWhenReady()
  }

  override disconnectedCallback(): void {
    this.isInitialized = false
    super.disconnectedCallback()
  }

  private initializeWhenReady(): void {
    if (this.isInitialized) {
      return
    }

    if (!hasTooltipElements(this)) {
      scheduleMicrotask(() => {
        if (!this.isConnected) {
          return
        }

        this.initializeWhenReady()
      })

      return
    }

    initializeTooltipHost(this)
    this.isInitialized = true
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

const upgradeTooltipCandidate = (element: HTMLElement): HTMLElement | null => {
  const title = element.getAttribute('title')?.trim()
  if (!title || !element.parentNode) {
    return null
  }

  const document = element.ownerDocument
  const parentNode = element.parentNode
  const nextSibling = element.nextSibling
  const wrapper = document.createElement(TooltipElement.registeredName)
  wrapper.className = TOOLTIP_HOST_CLASSES

  const trigger = createTriggerElement(document)
  const tooltip = createTooltipPopupElement(document, title)

  element.removeAttribute('title')

  trigger.append(element)
  wrapper.append(trigger, tooltip)
  parentNode.insertBefore(wrapper, nextSibling)

  return wrapper
}

export const enhanceTooltipElements = (root: ParentNode = document): HTMLElement[] => {
  return queryTooltipUpgradeCandidates(root)
    .map(element => upgradeTooltipCandidate(element))
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
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
export const registerWebComponent = async (tagName = TooltipElement.registeredName) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, TooltipElement)

  if (document.body?.childElementCount) {
    enhanceTooltipElements(document)
  }

  registerPageLoadListener()
}

export const registerTooltipWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<TooltipElement> = {
  registeredName: TooltipElement.registeredName,
  componentCtor: TooltipElement,
  registerWebComponent,
}
