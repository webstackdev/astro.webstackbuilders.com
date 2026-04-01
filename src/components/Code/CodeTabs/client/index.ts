import { LitElement } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import {
  queryCodeTabsIconMarkup,
  queryCheckIconElement,
  queryCodeBlocks,
  queryCodeElement,
  queryCopyIconElement,
  queryTitleCheckIconElement,
  queryTitleCopyIconElement,
  queryTitleCopyIconSvgs,
} from './selectors'

const ICON_BANK_ID = 'code-tabs-icon-bank'

function getCodeText(pre: HTMLPreElement): string {
  const code = queryCodeElement(pre)
  const text = (code?.textContent ?? pre.textContent ?? '').replace(/\n$/, '')
  return text
}

const EXCLUDED_SINGLE_TAB_LANGUAGES = new Set(['text', 'mermaid', 'math'])

/**
 * Fallback label formatter for cases where `data-language-label` is not set
 * (e.g. cached HTML from before the server-side label was introduced).
 * The canonical display name config lives in `src/lib/config/codeBlocks.ts`.
 */
function formatLanguageLabelFallback(language: string): string {
  const normalized = language.trim().toLowerCase()
  const labelMap: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    md: 'Markdown',
  }

  return labelMap[normalized] ?? (language.trim() || language)
}

function getTabLabel(pre: HTMLPreElement): string | null {
  const explicit = pre.getAttribute('data-code-tabs-tab')
  if (explicit && explicit.trim()) return explicit.trim()

  // Use title from code fence meta (e.g. title="otel-tail-sampling.yaml")
  // in place of the language label when present.
  const codeTitle = pre.getAttribute('data-code-title')
  if (codeTitle && codeTitle.trim()) return codeTitle.trim()

  // Use server-computed display label from the centralized config.
  const label = pre.getAttribute('data-language-label')
  if (label && label.trim()) return label.trim()

  const language = pre.getAttribute('data-language')
  if (!language || !language.trim()) return null
  if (EXCLUDED_SINGLE_TAB_LANGUAGES.has(language.trim().toLowerCase())) return null

  return formatLanguageLabelFallback(language)
}

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    const nav = (globalThis as unknown as { navigator?: Navigator }).navigator
    const clipboard = nav?.clipboard
    if (clipboard && typeof clipboard.writeText === 'function') {
      await clipboard.writeText(text)
      return true
    }
  } catch {
    return false
  }

  return false
}

export class CodeTabsElement extends LitElement {
  static registeredName = 'code-tabs'

  private tabButtons: HTMLButtonElement[] = []
  private codeBlocks: HTMLPreElement[] = []
  private activeIndex = 0
  private copyTimer: number | null = null
  private titleCopyTimer: number | null = null
  private isInteractiveTabs = false

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (this.dataset['enhanced'] === 'true') return
    this.dataset['enhanced'] = 'true'

    this.codeBlocks = queryCodeBlocks(this)

    if (this.codeBlocks.length === 0) return

    const labels = this.codeBlocks
      .map(pre => getTabLabel(pre))
      .filter((label): label is string => Boolean(label))

    this.isInteractiveTabs = this.codeBlocks.length >= 2
    const shouldRenderTabs = this.isInteractiveTabs || (this.codeBlocks.length === 1 && labels.length === 1)

    this.buildUi({ shouldRenderTabs, labels })

    if (shouldRenderTabs) this.setActive(0)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.copyTimer !== null) {
      window.clearTimeout(this.copyTimer)
      this.copyTimer = null
    }
    if (this.titleCopyTimer !== null) {
      window.clearTimeout(this.titleCopyTimer)
      this.titleCopyTimer = null
    }
  }

  private buildUi(args: { shouldRenderTabs: boolean; labels: string[] }): void {
    const header = document.createElement('div')
    header.className =
      'code-tabs-print-header flex w-full min-w-0 items-center justify-between bg-page-offset'

    const copyButton = this.createCopyButton()

    if (args.shouldRenderTabs) {
      const list = document.createElement('ul')
      const isSingleTab = !this.isInteractiveTabs
      list.className = isSingleTab
        ? 'flex-1 min-w-0 p-0 whitespace-nowrap overflow-auto'
        : 'flex-1 min-w-0 p-0 whitespace-nowrap overflow-auto select-none'

      this.tabButtons = this.codeBlocks.map((_, index) => {
        const tabLabel = args.labels[index] || `Tab ${index + 1}`

        const li = document.createElement('li')
        li.className = 'list-none inline-block relative'

        /**
         * Single-tab blocks render a selectable label with a hover-only copy icon
         * instead of an interactive tab button.
         */
        if (isSingleTab) {
          const wrapper = document.createElement('span')
          wrapper.className = 'group inline-flex items-center gap-1 px-2 py-1 m-2'

          const label = document.createElement('span')
          label.className = 'text-content select-text cursor-text'
          label.textContent = tabLabel

          const copyIcon = this.createTitleCopyIcon(tabLabel)

          wrapper.append(label, copyIcon)
          li.append(wrapper)
          list.append(li)

          /** Placeholder so index alignment with codeBlocks is preserved */
          const placeholder = document.createElement('button')
          placeholder.type = 'button'
          placeholder.hidden = true
          return placeholder
        }

        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'inline-block px-2 py-1 m-2 text-content-offset'
        button.textContent = tabLabel
        button.setAttribute('data-code-tabs-button', String(index))

        addButtonEventListeners(button, () => this.setActive(index), this)

        li.append(button)
        list.append(li)

        return button
      })

      header.append(list)
    } else {
      const spacer = document.createElement('div')
      spacer.className = 'flex-1 min-w-0'
      header.append(spacer)
      this.tabButtons = []
    }

    header.append(copyButton)

    this.prepend(header)
  }

  private createCopyButton(): HTMLButtonElement {
    const title = this.getAttribute('copy-button-title') || 'Copy'
    const tooltip = this.getAttribute('copy-button-tooltip') || title

    const button = document.createElement('button')
    button.type = 'button'
    button.className =
      'flex shrink-0 items-center gap-2 mr-2 px-3 py-2 text-content hover:text-content-active'
    button.setAttribute('aria-label', tooltip)
    button.title = tooltip

    const copySvg = queryCodeTabsIconMarkup({
      iconBankId: ICON_BANK_ID,
      iconName: 'copy',
      root: document,
    }) ?? ''
    const checkSvg = queryCodeTabsIconMarkup({
      iconBankId: ICON_BANK_ID,
      iconName: 'check',
      root: document,
    }) ?? ''

    button.innerHTML = `
      <span data-code-tabs-copy-icon="copy">${copySvg}</span>
      <span data-code-tabs-copy-icon="check" class="hidden">${checkSvg}</span>
      <span class="text-sm">${title}</span>
    `

    addButtonEventListeners(
      button,
      () => {
        void this.copyActiveCode(button)
      },
      this
    )

    return button
  }

  /**
   * Create a small copy icon for the title label in single-tab code blocks.
   * The icon is hidden by default and only appears on hover via Tailwind `group-hover`.
   * Clicking it copies the title text to the clipboard.
   */
  private createTitleCopyIcon(text: string): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.tabIndex = -1
    btn.className = [
      'inline-flex items-center opacity-0 group-hover:opacity-100',
      'transition-opacity cursor-pointer',
      'text-content hover:text-content-active',
    ].join(' ')
    btn.setAttribute('aria-label', `Copy "${text}"`)
    btn.title = `Copy "${text}"`

    const copySvg = queryCodeTabsIconMarkup({
      iconBankId: ICON_BANK_ID,
      iconName: 'copy',
      root: document,
    }) ?? ''
    const checkSvg = queryCodeTabsIconMarkup({
      iconBankId: ICON_BANK_ID,
      iconName: 'check',
      root: document,
    }) ?? ''

    btn.innerHTML = `
      <span data-title-copy-icon="copy">${copySvg}</span>
      <span data-title-copy-icon="check" class="hidden">${checkSvg}</span>
    `

    /** Scale icons down to match the label text size */
    queryTitleCopyIconSvgs(btn).forEach(svg => {
      svg.classList.remove('w-5', 'h-5')
      svg.classList.add('w-3.5', 'h-3.5')
    })

    addButtonEventListeners(btn, (e) => {
      e.stopPropagation()
      void this.copyTitleText(btn, text)
    }, this)

    return btn
  }

  private async copyTitleText(button: HTMLButtonElement, text: string): Promise<void> {
    const copied = await writeToClipboard(text)
    if (!copied) return

    const copy = queryTitleCopyIconElement(button)
    const check = queryTitleCheckIconElement(button)
    copy?.classList.add('hidden')
    check?.classList.remove('hidden')

    if (this.titleCopyTimer !== null) window.clearTimeout(this.titleCopyTimer)

    this.titleCopyTimer = window.setTimeout(() => {
      copy?.classList.remove('hidden')
      check?.classList.add('hidden')
      this.titleCopyTimer = null
    }, 1500)
  }

  private setActive(index: number): void {
    this.activeIndex = index

    if (this.codeBlocks.length > 1) {
      this.codeBlocks.forEach((pre, i) => {
        pre.classList.toggle('hidden', i !== index)
      })
    }

    this.tabButtons.forEach((btn, i) => {
      const isActive = i === index
      btn.classList.toggle('text-content', isActive)
      btn.classList.toggle('text-content-offset', !isActive)

      // Hover color behavior:
      // - Single-tab UI: no hover color change.
      // - Multi-tab UI: inactive tabs change color on hover; active tab does not.
      if (!this.isInteractiveTabs) {
        btn.classList.remove('hover:text-content-active')
        return
      }

      btn.classList.toggle('hover:text-content-active', !isActive)
    })
  }

  private async copyActiveCode(button: HTMLButtonElement): Promise<void> {
    const active = this.codeBlocks[this.activeIndex]
    if (!active) return

    const text = getCodeText(active)
    if (!text) return

    const copied = await writeToClipboard(text)
    if (!copied) return

    this.toggleCopiedState(button, true)

    if (this.copyTimer !== null) window.clearTimeout(this.copyTimer)

    this.copyTimer = window.setTimeout(() => {
      this.toggleCopiedState(button, false)
      this.copyTimer = null
    }, 1500)
  }

  private toggleCopiedState(button: HTMLButtonElement, copied: boolean): void {
    const copy = queryCopyIconElement(button)
    const check = queryCheckIconElement(button)

    copy?.classList.toggle('hidden', copied)
    check?.classList.toggle('hidden', !copied)
  }
}

export const registerWebComponent = async (
  tagName = CodeTabsElement.registeredName
): Promise<void> => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, CodeTabsElement)
}

export const registerCodeTabsWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<CodeTabsElement> = {
  registeredName: CodeTabsElement.registeredName,
  componentCtor: CodeTabsElement,
  registerWebComponent,
}
