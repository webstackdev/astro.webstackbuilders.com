import { LitElement } from 'lit'
import { actions } from 'astro:actions'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { getSearchResultsElements } from './selectors'
import type { SearchHit } from '@actions/search/@types'

const MIN_QUERY_LENGTH = 2

export class SearchResultsElement extends LitElement {
	static registeredName = 'search-results'

	static override properties = {
		query: { type: String, attribute: 'query' },
		limit: { type: Number, attribute: 'limit' },
	}

	declare query?: string
	declare limit: number

	private meta: HTMLElement | null = null
	private errorEl: HTMLElement | null = null
	private resultsList: HTMLOListElement | null = null
	private input: HTMLInputElement | null = null

	protected override createRenderRoot() {
		// Light DOM
		return this
	}

	constructor() {
		super()
		this.limit = 20
	}

	override connectedCallback(): void {
		super.connectedCallback()
		this.cacheElements()
		void this.run()
	}

	private cacheElements(): void {
		const { meta, error, resultsList, input } = getSearchResultsElements(this)

		this.meta = meta
		this.errorEl = error
		this.resultsList = resultsList
		this.input = input
	}

	private setText(element: HTMLElement | null, text: string): void {
		if (!element) {
			return
		}

		element.textContent = text
	}

	private showError(message: string): void {
		if (!this.errorEl) {
			return
		}

		this.errorEl.classList.remove('hidden')
		this.setText(this.errorEl, message)
	}

	private clearError(): void {
		if (!this.errorEl) {
			return
		}

		this.errorEl.classList.add('hidden')
		this.setText(this.errorEl, '')
	}

	private renderResults(hits: SearchHit[]): void {
		if (!this.resultsList) {
			return
		}

		this.resultsList.innerHTML = ''

		for (const hit of hits) {
			const li = document.createElement('li')
			li.className = 'space-y-1'

			const link = document.createElement('a')
			link.href = hit.url
			link.className =
				'text-lg font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
			link.textContent = hit.title

			li.appendChild(link)

			if (hit.snippet) {
				const snippet = document.createElement('p')
				snippet.className = 'text-sm text-text-offset leading-relaxed'
				snippet.textContent = hit.snippet
				li.appendChild(snippet)
			}

			this.resultsList.appendChild(li)
		}
	}

	private getQueryFromLocation(): string {
		return new URLSearchParams(window.location.search).get('q')?.trim() ?? ''
	}

	private getQuery(): string {
		return (this.query ?? '').trim() || this.getQueryFromLocation()
	}

	private async run(): Promise<void> {
		const query = this.getQuery()
		this.clearError()

		if (this.input && typeof this.input.value === 'string' && this.input.value !== query) {
			this.input.value = query
		}

		if (!query) {
			this.setText(this.meta, '')
			this.renderResults([])
			return
		}

		if (query.length < MIN_QUERY_LENGTH) {
			this.setText(this.meta, 'Type at least 2 characters to search.')
			this.renderResults([])
			return
		}

		this.setText(this.meta, 'Searching…')

		const { data, error } = await actions.search.query({ q: query, limit: this.limit })

		// @TODO: Improve this error handling to be more user friendly. Should look at the types of errors that could occur, and give the user an idea of what to do.
		if (error) {
			const message = error instanceof Error ? error.message : 'Search failed.'
			this.renderResults([])
			this.setText(this.meta, '')
			this.showError(message)
			return
		}

		if (!data) {
			this.renderResults([])
			this.setText(this.meta, '')
			return
		}

		const hits = (data.hits ?? []) as SearchHit[]
		this.renderResults(hits)
		this.setText(this.meta, `${hits.length} result${hits.length === 1 ? '' : 's'} for ${query}`)
	}
}

export const registerSearchResultsComponent = async (tagName = SearchResultsElement.registeredName): Promise<void> => {
	defineCustomElement(tagName, SearchResultsElement)
}

export const webComponentModule: WebComponentModule<SearchResultsElement> = {
	registeredName: SearchResultsElement.registeredName,
	componentCtor: SearchResultsElement,
	registerWebComponent: registerSearchResultsComponent,
}