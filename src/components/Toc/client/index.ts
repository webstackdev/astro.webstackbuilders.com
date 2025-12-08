import { LitElement } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import {
  hideTableOfContents,
  onVisibilityChange,
  showTableOfContents,
  type VisibilityListener,
} from '@components/scripts/store/visibility'

export class TableOfContentsElement extends LitElement {
  static registeredName = 'table-of-contents'

  static override properties = {
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  }

  declare open: boolean
  declare disabled: boolean

  private toggleButton: HTMLButtonElement | null = null
  private overlay: HTMLButtonElement | null = null
  private panel: HTMLElement | null = null
  private unsubscribe: (() => void) | null = null
  private visibilityListener?: VisibilityListener

  constructor() {
    super()
    this.open = false
    this.disabled = false
  }

  protected override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.cacheElements()
    this.attachListeners()
    this.visibilityListener = (state) => {
      this.open = state.tableOfContentsVisible
      this.disabled = !state.tableOfContentsEnabled
    }
    this.unsubscribe = onVisibilityChange(this.visibilityListener)
    this.syncAttributes()
  }

  override disconnectedCallback(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
    super.disconnectedCallback()
  }

  protected override updated(): void {
    this.syncAttributes()
  }

  private cacheElements(): void {
    this.toggleButton = this.querySelector('[data-toc-toggle]') as HTMLButtonElement | null
    this.overlay = this.querySelector('[data-toc-overlay]') as HTMLButtonElement | null
    this.panel = this.querySelector('[data-toc-panel]') as HTMLElement | null
  }

  private attachListeners(): void {
    if (this.toggleButton && !this.toggleButton.dataset['tocListener']) {
      addButtonEventListeners(this.toggleButton, this.handleToggle, this)
      this.toggleButton.dataset['tocListener'] = 'true'
    }

    if (this.overlay && !this.overlay.dataset['tocListener']) {
      addButtonEventListeners(this.overlay, this.handleOverlay, this)
      this.overlay.dataset['tocListener'] = 'true'
    }
  }

  private syncAttributes(): void {
    this.toggleAttribute('data-open', this.open)
    this.toggleAttribute('data-disabled', this.disabled)

    if (this.toggleButton) {
      this.toggleButton.setAttribute('aria-expanded', String(this.open))
      this.toggleButton.setAttribute('aria-pressed', String(this.open))
      this.toggleButton.toggleAttribute('disabled', this.disabled)
    }

    if (this.overlay) {
      this.overlay.setAttribute('data-visible', String(this.open))
      this.overlay.setAttribute('aria-hidden', this.open ? 'false' : 'true')
    }

    if (this.panel) {
      this.panel.setAttribute('data-state', this.open ? 'open' : 'closed')
    }
  }

  private readonly handleToggle = (event: Event) => {
    event.preventDefault()
    if (this.disabled) {
      hideTableOfContents()
      return
    }

    if (this.open) {
      hideTableOfContents()
      return
    }

    showTableOfContents()
  }

  private readonly handleOverlay = (event: Event) => {
    event.preventDefault()
    hideTableOfContents()
  }
}

export const registerTableOfContentsComponent = async (
  tagName = TableOfContentsElement.registeredName,
): Promise<void> => {
  defineCustomElement(tagName, TableOfContentsElement)
}

export const webComponentModule: WebComponentModule<TableOfContentsElement> = {
  registeredName: TableOfContentsElement.registeredName,
  componentCtor: TableOfContentsElement,
  registerWebComponent: registerTableOfContentsComponent,
}
