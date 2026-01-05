import { LitElement, html, nothing } from 'lit'
import { render } from 'lit/html.js'
import { actions } from 'astro:actions'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { getSearchBarElements } from './selectors'
import type { SearchHit } from '@actions/search/@types'

export class SearchBarElement extends LitElement {
  static registeredName = 'search-bar'

  private form: HTMLFormElement | null = null
  private input: HTMLInputElement | null = null
  private resultsContainer: HTMLElement | null = null
  private resultsList: HTMLUListElement | null = null

  private debounceHandle: ReturnType<typeof setTimeout> | null = null
  private latestRequestId = 0

  protected override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.cacheElements()
    this.attachListeners()
  }

  override disconnectedCallback(): void {
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle)
      this.debounceHandle = null
    }

    super.disconnectedCallback()
  }

  private cacheElements(): void {
    const { form, input, resultsContainer, resultsList } = getSearchBarElements(this)

    this.form = form
    this.input = input
    this.resultsContainer = resultsContainer
    this.resultsList = resultsList
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
        <li class="px-4 py-3 hover:bg-content-inverse-offset">
          <a class="block text-sm" href=${url}>${title}</a>
        </li>
      `
    })

    const searchFor = html`
      <li class="px-4 py-3 hover:bg-content-inverse-offset">
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
