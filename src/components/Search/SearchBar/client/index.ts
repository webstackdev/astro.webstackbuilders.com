import { LitElement, html, nothing } from 'lit'
import { render } from 'lit/html.js'
import { actions } from 'astro:actions'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { getSearchBarElements, getSearchBarOptionalElements } from './selectors'
import type { SearchHit } from '@actions/search/@types'
import {
  closeHeaderSearch,
  getHeaderSearchExpanded,
  openHeaderSearch,
  subscribeHeaderSearchExpanded,
} from '@components/scripts/store'

export class SearchBarElement extends LitElement {
  static registeredName = 'search-bar'

  private form: HTMLFormElement | null = null
  private input: HTMLInputElement | null = null
  private resultsContainer: HTMLElement | null = null
  private resultsList: HTMLUListElement | null = null

  private toggleBtn: HTMLButtonElement | null = null
  private panel: HTMLElement | null = null
  private isExpanded = true

  private isOutsideListenersAttached = false
  private unsubscribeHeaderSearchExpanded: (() => void) | null = null

  private debounceHandle: ReturnType<typeof setTimeout> | null = null
  private latestRequestId = 0

  protected override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.cacheElements()
    this.initHeaderExpandedState()
    this.attachListeners()
  }

  override disconnectedCallback(): void {
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle)
      this.debounceHandle = null
    }

    if (this.unsubscribeHeaderSearchExpanded) {
      this.unsubscribeHeaderSearchExpanded()
      this.unsubscribeHeaderSearchExpanded = null
    }

    this.detachOutsideListeners()

    super.disconnectedCallback()
  }

  private cacheElements(): void {
    const { form, input, resultsContainer, resultsList } = getSearchBarElements(this)
    const { toggleBtn, panel } = getSearchBarOptionalElements(this)

    this.form = form
    this.input = input
    this.resultsContainer = resultsContainer
    this.resultsList = resultsList

    this.toggleBtn = toggleBtn
    this.panel = panel
    this.isExpanded = this.toggleBtn ? getHeaderSearchExpanded() : this.getIsExpandedFromDom()
  }

  private initHeaderExpandedState(): void {
    if (!this.toggleBtn) {
      return
    }

    const query = this.getQuery()
    const storeExpanded = getHeaderSearchExpanded()

    // If the input is pre-populated, force-open so the user can see/edit it.
    const desiredExpanded = query.length > 0 ? true : storeExpanded

    if (desiredExpanded && !storeExpanded) {
      openHeaderSearch()
    }

    if (!desiredExpanded && storeExpanded) {
      closeHeaderSearch()
    }

    this.setExpandedState(desiredExpanded, { updateStore: false })

    if (!this.unsubscribeHeaderSearchExpanded) {
      this.unsubscribeHeaderSearchExpanded = subscribeHeaderSearchExpanded(nextExpanded => {
        if (!this.toggleBtn) {
          return
        }

        if (nextExpanded === this.isExpanded) {
          return
        }

        this.setExpandedState(nextExpanded, { updateStore: false })
      })
    }
  }

  private getIsExpandedFromDom(): boolean {
    if (!this.toggleBtn) {
      return true
    }

    const expanded = this.toggleBtn.getAttribute('aria-expanded')
    return expanded === 'true'
  }

  private attachListeners(): void {
    if (!this.input) {
      return
    }

    if (!this.input.dataset['searchListener']) {
      this.input.addEventListener('input', this.handleInput)
      this.input.addEventListener('blur', this.handleBlur)
      this.input.dataset['searchListener'] = 'true'
    }

    if (this.form && !this.form.dataset['searchListener']) {
      this.form.addEventListener('submit', this.handleSubmit)
      this.form.dataset['searchListener'] = 'true'
    }

    if (this.resultsContainer && !this.resultsContainer.dataset['searchListener']) {
      this.resultsContainer.addEventListener('mousedown', this.handleResultsMouseDown)
      this.resultsContainer.dataset['searchListener'] = 'true'
    }

    if (this.toggleBtn && !this.toggleBtn.dataset['searchListener']) {
      this.toggleBtn.addEventListener('click', this.handleToggleClick)
      this.toggleBtn.dataset['searchListener'] = 'true'
    }

    if (!this.dataset['searchKeyListener']) {
      this.addEventListener('keydown', this.handleKeyDown)
      this.dataset['searchKeyListener'] = 'true'
    }
  }

  private setExpandedState(isExpanded: boolean, { updateStore = true }: { updateStore?: boolean } = {}): void {
    this.isExpanded = isExpanded

    if (updateStore && this.toggleBtn) {
      if (isExpanded) {
        openHeaderSearch()
      } else {
        closeHeaderSearch()
      }
    }

    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
      this.toggleBtn.setAttribute('data-state', isExpanded ? 'open' : 'closed')
    }

    const state = isExpanded ? 'open' : 'closed'
    this.panel?.setAttribute('data-state', state)
    this.form?.setAttribute('data-state', state)

    if (this.input) {
      if (isExpanded) {
        this.input.classList.remove('hidden')
      } else {
        this.input.classList.add('hidden')
      }
    }

    if (!isExpanded) {
      this.clearResults()
      this.hideResults()
      this.detachOutsideListeners()
    } else {
      this.attachOutsideListeners()
    }
  }

  private expand(): void {
    if (!this.toggleBtn) {
      return
    }

    this.setExpandedState(true)
    this.input?.focus()
  }

  private collapse({ restoreFocus = true }: { restoreFocus?: boolean } = {}): void {
    if (!this.toggleBtn) {
      return
    }

    this.setExpandedState(false)

    if (restoreFocus) {
      this.toggleBtn.focus()
    }
  }

  private attachOutsideListeners(): void {
    if (!this.toggleBtn) {
      return
    }

    if (this.isOutsideListenersAttached) {
      return
    }

    document.addEventListener('pointerdown', this.handleDocumentPointerDown, true)
    document.addEventListener('focusin', this.handleDocumentFocusIn, true)
    this.isOutsideListenersAttached = true
  }

  private detachOutsideListeners(): void {
    if (!this.isOutsideListenersAttached) {
      return
    }

    document.removeEventListener('pointerdown', this.handleDocumentPointerDown, true)
    document.removeEventListener('focusin', this.handleDocumentFocusIn, true)
    this.isOutsideListenersAttached = false
  }

  private isEventTargetInsideSelf(eventTarget: EventTarget | null): boolean {
    if (!eventTarget) {
      return false
    }

    if (!(eventTarget instanceof Node)) {
      return false
    }

    return this.contains(eventTarget)
  }

  private readonly handleToggleClick = () => {
    if (!this.toggleBtn) {
      return
    }

    if (this.isExpanded) {
      this.collapse({ restoreFocus: true })
      return
    }

    this.expand()
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (!this.toggleBtn) {
      return
    }

    if (event.key !== 'Escape') {
      return
    }

    if (!this.isExpanded) {
      return
    }

    event.preventDefault()
    this.collapse({ restoreFocus: true })
  }

  private readonly handleDocumentPointerDown = (event: PointerEvent) => {
    if (!this.toggleBtn || !this.isExpanded) {
      return
    }

    if (this.isEventTargetInsideSelf(event.target)) {
      return
    }

    this.collapse({ restoreFocus: false })
  }

  private readonly handleDocumentFocusIn = (event: FocusEvent) => {
    if (!this.toggleBtn || !this.isExpanded) {
      return
    }

    if (this.isEventTargetInsideSelf(event.target)) {
      return
    }

    this.collapse({ restoreFocus: false })
  }

  private readonly handleResultsMouseDown = () => {
    // Prevent blur handler from immediately hiding the list
    // when clicking suggestions.
    if (this.input) {
      this.input.dataset['ignoreBlur'] = 'true'
    }
  }

  private readonly handleBlur = () => {
    if (!this.input) {
      return
    }

    const ignore = this.input.dataset['ignoreBlur'] === 'true'
    this.input.dataset['ignoreBlur'] = 'false'

    if (ignore) {
      return
    }

    setTimeout(() => this.hideResults(), 150)
  }

  private readonly handleSubmit = (event: Event) => {
    event.preventDefault()

    if (this.toggleBtn && !this.isExpanded) {
      this.expand()
      return
    }

    const query = this.getQuery()
    if (!query) {
      return
    }

    window.location.assign(`/search?q=${encodeURIComponent(query)}`)
  }

  private readonly handleInput = () => {
    const query = this.getQuery()

    if (!query || query.length < 2) {
      this.clearResults()
      this.hideResults()
      return
    }

    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle)
    }

    this.debounceHandle = setTimeout(() => {
      void this.fetchAndRender(query)
    }, 250)
  }

  private getQuery(): string {
    return (this.input?.value ?? '').trim()
  }

  private showResults(): void {
    this.resultsContainer?.classList.remove('hidden')
  }

  private hideResults(): void {
    this.resultsContainer?.classList.add('hidden')
  }

  private clearResults(): void {
    if (this.resultsList) {
      render(nothing, this.resultsList)
    }
  }

  private renderResults(query: string, hits: SearchHit[]): void {
    if (!this.resultsList) {
      return
    }

    const items = hits.map(hit => {
      const url = hit.url || `/search?q=${encodeURIComponent(query)}`
      const title = hit.title || query

      return html`
        <li class="px-4 py-3 hover:bg-page-base-offset">
          <a class="block text-sm" href=${url}>${title}</a>
        </li>
      `
    })

    const searchFor = html`
      <li class="px-4 py-3 hover:bg-page-base-offset">
        <a class="block text-sm" href=${`/search?q=${encodeURIComponent(query)}`}>
          Search for &quot;${query}&quot;
        </a>
      </li>
    `

    render(html`${items}${searchFor}`, this.resultsList)
  }

  private async fetchAndRender(query: string): Promise<void> {
    const context = { scriptName: 'SearchBarElement', operation: 'fetchAndRender' }
    addScriptBreadcrumb(context)

    const requestId = ++this.latestRequestId
    const { data, error } = await actions.search.query({ q: query, limit: 8 })

    // @TODO: Improve this error handling to be more user friendly. Should look at the types of errors that could occur, and give the user an idea of what to do.
    if (error) {
      handleScriptError(error, context)
      this.clearResults()
      this.hideResults()
      return
    }

    if (!data) {
      this.clearResults()
      this.hideResults()
      return
    }

    if (requestId !== this.latestRequestId) {
      return
    }

    const hits = (data.hits ?? []) as SearchHit[]
    if (hits.length === 0) {
      this.clearResults()
      this.hideResults()
      return
    }

    this.renderResults(query, hits)
    this.showResults()
  }
}

export const registerSearchBarComponent = async (
  tagName = SearchBarElement.registeredName
): Promise<void> => {
  defineCustomElement(tagName, SearchBarElement)
}

export const webComponentModule: WebComponentModule<SearchBarElement> = {
  registeredName: SearchBarElement.registeredName,
  componentCtor: SearchBarElement,
  registerWebComponent: registerSearchBarComponent,
}
