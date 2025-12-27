import { LitElement } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  addButtonEventListeners,
  addLinkEventListeners,
  addWrapperEventListeners,
} from '@components/scripts/elementListeners'
import {
  hideTableOfContents,
  onVisibilityChange,
  showTableOfContents,
  type VisibilityListener,
} from '@components/scripts/store/tableOfContents'
import { getTableOfContentsElements } from './selectors'

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
  private tocLinks: HTMLAnchorElement[] = []
  private unsubscribe: (() => void) | null = null
  private visibilityListener?: VisibilityListener
  private lastFocusedElement: HTMLElement | null = null
  private previousOpen = false
  private activeSlug: string | null = null
  private headingObserver: IntersectionObserver | null = null

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
    this.initializeScrollSpy()
    this.visibilityListener = state => {
      this.open = state.tableOfContentsVisible
      this.disabled = !state.tableOfContentsEnabled
    }
    this.unsubscribe = onVisibilityChange(this.visibilityListener)
    this.syncAttributes()
  }

  override disconnectedCallback(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
    this.headingObserver?.disconnect()
    this.headingObserver = null
    super.disconnectedCallback()
  }

  protected override updated(): void {
    this.syncAttributes()
  }

  private cacheElements(): void {
    const { toggleButton, overlay, panel, tocLinks } = getTableOfContentsElements(this)
    this.toggleButton = toggleButton
    this.overlay = overlay
    this.panel = panel
    this.tocLinks = tocLinks
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

    if (this.panel && !this.panel.dataset['tocEscapeListener']) {
      addWrapperEventListeners(this.panel, this.handleEscape, this)
      this.panel.dataset['tocEscapeListener'] = 'true'
    }

    this.tocLinks.forEach(link => {
      if (link.dataset['tocListener']) {
        return
      }
      addLinkEventListeners(link, this.handleLinkClick, this)
      link.dataset['tocListener'] = 'true'
    })
  }

  private isDesktopLayout(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    if (typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia('(min-width: 1024px)').matches
  }

  private syncAttributes(): void {
    this.toggleAttribute('data-open', this.open)
    this.toggleAttribute('data-disabled', this.disabled)

    if (this.toggleButton) {
      this.toggleButton.setAttribute('aria-expanded', String(this.open))
      this.toggleButton.toggleAttribute('disabled', this.disabled)
    }

    if (this.overlay) {
      this.overlay.setAttribute('data-visible', String(this.open))
      this.overlay.setAttribute('aria-hidden', this.open ? 'false' : 'true')

      const isDesktop = this.isDesktopLayout()
      const shouldDisableOverlay = !this.open || this.disabled || isDesktop
      this.overlay.toggleAttribute('disabled', shouldDisableOverlay)
      this.overlay.tabIndex = shouldDisableOverlay ? -1 : 0
    }

    if (this.panel) {
      this.panel.setAttribute('data-state', this.open ? 'open' : 'closed')

      const isDesktop = this.isDesktopLayout()
      if (!isDesktop) {
        this.panel.setAttribute('aria-hidden', this.open ? 'false' : 'true')
        this.setPanelFocusable(this.open)
      } else {
        this.panel.removeAttribute('aria-hidden')
        this.setPanelFocusable(true)
      }
    }

    if (!this.previousOpen && this.open) {
      this.lastFocusedElement = (document.activeElement as HTMLElement | null) ?? null
      this.focusFirstTocLink()
    }

    if (this.previousOpen && !this.open) {
      this.restoreFocus()
    }

    this.previousOpen = this.open
  }

  private setPanelFocusable(isFocusable: boolean): void {
    const focusableLinks = this.tocLinks
    focusableLinks.forEach(link => {
      link.tabIndex = isFocusable ? 0 : -1
    })
  }

  private focusFirstTocLink(): void {
    if (this.isDesktopLayout()) {
      return
    }

    const firstLink = this.tocLinks[0]
    firstLink?.focus()
  }

  private restoreFocus(): void {
    const fallback = this.toggleButton
    const candidate = this.lastFocusedElement

    if (candidate && typeof candidate.focus === 'function' && document.contains(candidate)) {
      candidate.focus()
      return
    }

    fallback?.focus()
  }

  private readonly handleEscape = (event: Event) => {
    if (!this.open) {
      return
    }

    if (event.cancelable && !event.defaultPrevented) {
      event.preventDefault()
    }
    hideTableOfContents()
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

  private readonly handleLinkClick = (_event: Event) => {
    if (this.isDesktopLayout()) {
      return
    }

    hideTableOfContents()
  }

  private initializeScrollSpy(): void {
    if (typeof window === 'undefined') {
      return
    }

    const IntersectionObserverCtor = (
      window as unknown as { IntersectionObserver?: typeof IntersectionObserver }
    ).IntersectionObserver

    if (typeof IntersectionObserverCtor !== 'function') {
      return
    }

    const slugs = this.tocLinks
      .map(link => link.dataset['tocSlug'])
      .filter((slug): slug is string => Boolean(slug))

    const headings = slugs
      .map(slug => window.document.getElementById(slug))
      .filter((heading): heading is HTMLElement => Boolean(heading))

    if (headings.length === 0) {
      return
    }

    const observer = new IntersectionObserverCtor(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))

        const next = visible[0]?.target
        const nextSlug = next instanceof HTMLElement ? next.id : null
        if (!nextSlug || nextSlug === this.activeSlug) {
          return
        }

        this.setCurrentSlug(nextSlug)
      },
      {
        root: null,
        threshold: [0.25, 0.5, 0.75],
        rootMargin: '0px 0px -60% 0px',
      }
    )

    headings.forEach(heading => observer.observe(heading))
    this.headingObserver = observer
  }

  private setCurrentSlug(slug: string): void {
    this.activeSlug = slug

    this.tocLinks.forEach(link => {
      const linkSlug = link.dataset['tocSlug']
      const isCurrent = Boolean(linkSlug && linkSlug === slug)
      if (isCurrent) {
        link.setAttribute('aria-current', 'location')
        link.setAttribute('data-current', 'true')
        return
      }

      link.removeAttribute('aria-current')
      link.setAttribute('data-current', 'false')
    })
  }
}

export const registerTableOfContentsComponent = async (
  tagName = TableOfContentsElement.registeredName
): Promise<void> => {
  defineCustomElement(tagName, TableOfContentsElement)
}

export const webComponentModule: WebComponentModule<TableOfContentsElement> = {
  registeredName: TableOfContentsElement.registeredName,
  componentCtor: TableOfContentsElement,
  registerWebComponent: registerTableOfContentsComponent,
}
