import { LitElement } from 'lit'
import { actions } from 'astro:actions'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { getSearchResultsElements } from './selectors'
import type { SearchHit } from '@actions/search/@types'

const MIN_QUERY_LENGTH = 2

const resultTypeLabels: Record<string, string> = {
  articles: 'Article',
  'case-studies': 'Case Study',
  'deep-dive': 'Deep Dive',
  downloads: 'Download',
  newsletter: 'Newsletter',
  services: 'Service',
  tags: 'Tag',
}

const getResultPath = (url: string): string => {
  try {
    const parsedUrl = new URL(url, window.location.origin)
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}` || url
  } catch {
    return url
  }
}

const getResultTypeLabel = (path: string): string => {
  const [firstSegment = ''] = path.replace(/^\/+/, '').split('/')
  return resultTypeLabels[firstSegment] ?? 'Page'
}

export class SearchResultsElement extends LitElement {
  static registeredName = 'search-results'

  static override properties = {
    query: { type: String, attribute: 'query' },
    limit: { type: Number, attribute: 'limit' },
  }

  declare query?: string
  declare limit: number

  private form: HTMLFormElement | null = null
  private meta: HTMLElement | null = null
  private errorEl: HTMLElement | null = null
  private resultsList: HTMLOListElement | null = null
  private emptyState: HTMLDivElement | null = null
  private input: HTMLInputElement | null = null
  private micBtn: HTMLButtonElement | null = null
  private clearBtn: HTMLButtonElement | null = null

  private speechRecognition: SpeechRecognition | null = null
  private isListening = false
  private debounceHandle: ReturnType<typeof setTimeout> | null = null
  private latestRequestId = 0

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
    this.attachListeners()
    void this.run()
  }

  override disconnectedCallback(): void {
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle)
      this.debounceHandle = null
    }

    this.stopSpeechRecognition()

    super.disconnectedCallback()
  }

  private cacheElements(): void {
    const { form, meta, error, resultsList, emptyState, input, micBtn, clearBtn } = getSearchResultsElements(this)

    this.form = form
    this.meta = meta
    this.errorEl = error
    this.resultsList = resultsList
    this.emptyState = emptyState
    this.input = input
    this.micBtn = micBtn
    this.clearBtn = clearBtn

    this.updateClearButtonVisibility()
    this.updateMicButtonVisibility()
  }

  private attachListeners(): void {
    if (!this.input || !this.form || !this.micBtn || !this.clearBtn) {
      return
    }

    if (!this.input.dataset['searchListener']) {
      this.input.addEventListener('input', this.handleInput)
      this.input.dataset['searchListener'] = 'true'
    }

    if (!this.form.dataset['searchListener']) {
      this.form.addEventListener('submit', this.handleSubmit)
      this.form.dataset['searchListener'] = 'true'
    }

    if (!this.micBtn.dataset['searchListener']) {
      addButtonEventListeners(this.micBtn, this.handleMicClick)
      this.micBtn.dataset['searchListener'] = 'true'
    }

    if (!this.clearBtn.dataset['searchListener']) {
      addButtonEventListeners(this.clearBtn, this.handleClearClick)
      this.clearBtn.dataset['searchListener'] = 'true'
    }
  }

  private setEmptyStateVisible(visible: boolean): void {
    if (!this.emptyState) {
      return
    }

    this.emptyState.classList.toggle('hidden', !visible)
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

    this.setEmptyStateVisible(false)
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

  private updateClearButtonVisibility(): void {
    if (!this.clearBtn) {
      return
    }

    this.clearBtn.toggleAttribute('hidden', this.getQuery().length === 0)
  }

  private getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
    const view = (this.ownerDocument?.defaultView ?? null) as
      | {
          SpeechRecognition?: new () => SpeechRecognition
          webkitSpeechRecognition?: new () => SpeechRecognition
        }
      | null

    const globalAny = globalThis as unknown as {
      SpeechRecognition?: new () => SpeechRecognition
      webkitSpeechRecognition?: new () => SpeechRecognition
      window?: {
        SpeechRecognition?: new () => SpeechRecognition
        webkitSpeechRecognition?: new () => SpeechRecognition
      }
    }

    return (
      view?.SpeechRecognition ??
      view?.webkitSpeechRecognition ??
      globalAny.SpeechRecognition ??
      globalAny.webkitSpeechRecognition ??
      globalAny.window?.SpeechRecognition ??
      globalAny.window?.webkitSpeechRecognition ??
      null
    )
  }

  private updateMicButtonVisibility(): void {
    if (!this.micBtn) {
      return
    }

    const supported = this.getSpeechRecognitionCtor() !== null
    this.micBtn.toggleAttribute('hidden', !supported)
    this.micBtn.setAttribute('aria-label', this.isListening ? 'Stop voice search' : 'Voice search')
  }

  private ensureSpeechRecognition(): SpeechRecognition | null {
    if (this.speechRecognition) {
      return this.speechRecognition
    }

    const Ctor = this.getSpeechRecognitionCtor()
    if (!Ctor) {
      return null
    }

    const recognition = new Ctor()
    recognition.continuous = false
    recognition.interimResults = true

    const docLang = document.documentElement.getAttribute('lang')
    recognition.lang = docLang && docLang.length > 0 ? docLang : 'en-US'

    recognition.onstart = () => {
      this.isListening = true
      this.updateMicButtonVisibility()
    }

    recognition.onend = () => {
      this.isListening = false
      this.updateMicButtonVisibility()
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      handleScriptError(new Error(`Speech recognition error: ${event.error}`), {
        scriptName: 'SearchResultsElement',
        operation: 'speechRecognition.onerror',
      })
      this.stopSpeechRecognition()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!this.input) {
        return
      }

      const transcript = this.getTranscriptFromSpeechEvent(event)
      if (!transcript) {
        return
      }

      this.input.value = transcript
      this.input.dispatchEvent(new Event('input', { bubbles: true }))
      this.input.focus()
    }

    this.speechRecognition = recognition
    return recognition
  }

  private getTranscriptFromSpeechEvent(event: SpeechRecognitionEvent): string {
    const eventAny = event as unknown as {
      resultIndex?: number
      results?: ArrayLike<ArrayLike<{ transcript?: string } & { confidence?: number }> & { isFinal?: boolean }>
    }

    const resultIndex = eventAny.resultIndex ?? 0
    const result = eventAny.results?.[resultIndex]
    const firstAlternative = result?.[0]
    return (firstAlternative?.transcript ?? '').trim()
  }

  private startSpeechRecognition(): void {
    const recognition = this.ensureSpeechRecognition()
    if (!recognition) {
      this.updateMicButtonVisibility()
      return
    }

    try {
      recognition.start()
    } catch (error) {
      handleScriptError(error, { scriptName: 'SearchResultsElement', operation: 'speechRecognition.start' })
    }
  }

  private stopSpeechRecognition(): void {
    if (!this.speechRecognition) {
      this.isListening = false
      this.updateMicButtonVisibility()
      return
    }

    try {
      this.speechRecognition.stop()
    } catch (error) {
      handleScriptError(error, { scriptName: 'SearchResultsElement', operation: 'speechRecognition.stop' })
    }
  }

  private syncQueryToLocation(query: string): void {
    const url = new URL(window.location.href)

    if (query) {
      url.searchParams.set('q', query)
    } else {
      url.searchParams.delete('q')
    }

    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }

  private renderResults(hits: SearchHit[]): void {
    if (!this.resultsList) {
      return
    }

    this.resultsList.innerHTML = ''
    this.setEmptyStateVisible(hits.length === 0)

    for (const hit of hits) {
      const li = document.createElement('li')
      li.className = 'space-y-1'

      const resultPath = getResultPath(hit.url)
      const resultTypeLabel = getResultTypeLabel(resultPath)

      const resultMeta = document.createElement('div')
      resultMeta.className = 'mb-1 flex items-center gap-2'

      const type = document.createElement('span')
      type.className = 'text-xs font-bold uppercase tracking-wider text-primary'
      type.textContent = resultTypeLabel

      const separator = document.createElement('span')
      separator.className = 'text-xs text-content-offset'
      separator.textContent = '•'

      const path = document.createElement('span')
      path.className = 'truncate font-mono text-xs text-content-offset'
      path.textContent = resultPath

      resultMeta.append(type, separator, path)
      li.appendChild(resultMeta)

      const link = document.createElement('a')
      link.href = hit.url
      link.className =
        'no-underline text-lg font-semibold text-page-inverse transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
      link.textContent = hit.title

      li.appendChild(link)

      /** Search result description */
      if (hit.snippet) {
        const snippet = document.createElement('p')
        snippet.className = 'text-sm text-content-active leading-relaxed'
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
    if (this.input) {
      return this.input.value.trim()
    }

    return (this.query ?? '').trim() || this.getQueryFromLocation()
  }

  private readonly handleSubmit = (event: Event) => {
    event.preventDefault()
    void this.run()
  }

  private readonly handleInput = () => {
    this.updateClearButtonVisibility()
    const query = this.getQuery()

    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle)
      this.debounceHandle = null
    }

    this.query = query
    this.syncQueryToLocation(query)
    this.clearError()

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
    this.debounceHandle = setTimeout(() => {
      void this.run(query)
    }, 250)
  }

  private readonly handleClearClick = () => {
    if (!this.input) {
      return
    }

    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle)
      this.debounceHandle = null
    }

    this.input.value = ''
    this.query = ''
    this.updateClearButtonVisibility()
    this.clearError()
    this.setText(this.meta, '')
    this.renderResults([])
    this.syncQueryToLocation('')
    this.input.focus()
  }

  private readonly handleMicClick = () => {
    if (this.isListening) {
      this.stopSpeechRecognition()
      return
    }

    this.startSpeechRecognition()
  }

  private async run(queryOverride?: string): Promise<void> {
    const query = (queryOverride ?? this.getQuery()).trim()
    this.query = query
    this.clearError()
    this.syncQueryToLocation(query)

    if (this.input && typeof this.input.value === 'string' && this.input.value !== query) {
      this.input.value = query
    }

    this.updateClearButtonVisibility()

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

    const context = { scriptName: 'SearchResultsElement', operation: 'run' }
    addScriptBreadcrumb(context)
    const requestId = ++this.latestRequestId

    const { data, error } = await actions.search.query({ q: query, limit: this.limit })

    // @TODO: Improve this error handling to be more user friendly. Should look at the types of errors that could occur, and give the user an idea of what to do.
    if (error) {
      const message = error instanceof Error ? error.message : 'Search failed.'
      handleScriptError(error, context)
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

    if (requestId !== this.latestRequestId) {
      return
    }

    const hits = (data.hits ?? []) as SearchHit[]
    this.renderResults(hits)
    this.setText(this.meta, `${hits.length} result${hits.length === 1 ? '' : 's'} for ${query}`)
  }
}

export const registerSearchResultsComponent = async (
  tagName = SearchResultsElement.registeredName
): Promise<void> => {
  defineCustomElement(tagName, SearchResultsElement)
}

export const webComponentModule: WebComponentModule<SearchResultsElement> = {
  registeredName: SearchResultsElement.registeredName,
  componentCtor: SearchResultsElement,
  registerWebComponent: registerSearchResultsComponent,
}
