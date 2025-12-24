import { LitElement } from 'lit'
import { actions } from 'astro:actions'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addScriptBreadcrumb } from '@components/scripts/errors'

type SearchHit = {
  title: string
  url: string
  snippet?: string
  score?: number
}

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
    this.form = this.querySelector('[data-search-form]') as HTMLFormElement | null
    this.input = this.querySelector('[data-search-input]') as HTMLInputElement | null
    this.resultsContainer = this.querySelector('[data-search-results]') as HTMLElement | null
    this.resultsList = this.querySelector('[data-search-results-list]') as HTMLUListElement | null
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
      this.resultsList.innerHTML = ''
    }
  }

  private renderResults(query: string, hits: SearchHit[]): void {
    if (!this.resultsList) {
      return
    }

    const items = hits
      .map(hit => {
        const url = hit.url || `/search?q=${encodeURIComponent(query)}`
        const title = hit.title || query

        return `
<li class="px-4 py-3 hover:bg-bg-offset">
  <a class="block text-sm text-text" href="${url}">${escapeHtml(title)}</a>
</li>`
      })
      .join('')

    const searchFor = `
<li class="px-4 py-3 hover:bg-bg-offset">
  <a class="block text-sm text-text" href="/search?q=${encodeURIComponent(query)}">Search for &quot;${escapeHtml(query)}&quot;</a>
</li>`

    this.resultsList.innerHTML = `${items}${searchFor}`
  }

  private async fetchAndRender(query: string): Promise<void> {
    const context = { scriptName: 'SearchBarElement', operation: 'fetchAndRender' }
    addScriptBreadcrumb(context)

    const requestId = ++this.latestRequestId

    try {
      const result = await actions.search.query({ q: query, limit: 8 })
      if (requestId !== this.latestRequestId) {
        return
      }

      const hits = (result.data?.hits ?? []) as SearchHit[]
      if (hits.length === 0) {
        this.clearResults()
        this.hideResults()
        return
      }

      this.renderResults(query, hits)
      this.showResults()
    } catch (error) {
      handleScriptError(error, context)
      this.clearResults()
      this.hideResults()
    }
  }
}

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export const registerSearchBarComponent = async (tagName = SearchBarElement.registeredName): Promise<void> => {
  defineCustomElement(tagName, SearchBarElement)
}

export const webComponentModule: WebComponentModule<SearchBarElement> = {
  registeredName: SearchBarElement.registeredName,
  componentCtor: SearchBarElement,
  registerWebComponent: registerSearchBarComponent,
}
