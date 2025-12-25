export function registerCodeTabsWebComponent(): void {
  const globalRef = globalThis as unknown as { customElements?: CustomElementRegistry; window?: Window }
  const registry = globalRef.customElements ?? globalRef.window?.customElements
  if (!registry) return

  try {
    if (registry.get('code-tabs')) return
    registry.define('code-tabs', CodeTabsElement)
  } catch {
    // Best effort only.
  }
}

import { addButtonEventListeners } from '@components/scripts/elementListeners'
import copyIcon from '../../../../icons/copy.svg?raw'
import checkIcon from '../../../../icons/check.svg?raw'
import {
  queryCheckIconElement,
  queryCodeBlocks,
  queryCodeElement,
  queryCopyIconElement,
} from './selectors'

function getIconMarkup(svgRaw: string): string {
  // Ensure the icon inherits currentColor and sizing via Tailwind classes.
  return svgRaw
    .replace('<svg', '<svg class="h-5 w-5" fill="currentColor"')
    .replace(/\s(width|height)="[^"]*"/g, '')
}

function getCodeText(pre: HTMLPreElement): string {
  const code = queryCodeElement(pre)
  const text = (code?.textContent ?? pre.textContent ?? '').replace(/\n$/, '')
  return text
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

class CodeTabsElement extends HTMLElement {
  private tabButtons: HTMLButtonElement[] = []
  private codeBlocks: HTMLPreElement[] = []
  private activeIndex = 0
  private copyTimer: number | null = null

  connectedCallback(): void {
    if (this.dataset['enhanced'] === 'true') return
    this.dataset['enhanced'] = 'true'

    this.codeBlocks = queryCodeBlocks(this)

    if (this.codeBlocks.length === 0) return

    const hasTabs = this.codeBlocks.length >= 2
    this.buildUi(hasTabs)

    if (hasTabs) {
      this.setActive(0)
    }
  }

  disconnectedCallback(): void {
    if (this.copyTimer !== null) {
      window.clearTimeout(this.copyTimer)
      this.copyTimer = null
    }
  }

  private buildUi(hasTabs: boolean): void {
    const header = document.createElement('div')
    header.className = 'flex w-full min-w-0 items-center justify-between border-b border-gray-200 bg-gray-50'

    const copyButton = this.createCopyButton()

    if (hasTabs) {
      const list = document.createElement('ul')
      list.className = 'flex-1 min-w-0 p-0 whitespace-nowrap overflow-auto select-none'

      this.tabButtons = this.codeBlocks.map((pre, index) => {
        const tabLabel = pre.getAttribute('data-code-tabs-tab') || `Tab ${index + 1}`

        const li = document.createElement('li')
        li.className = 'list-none inline-block relative'

        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'inline-block px-2 py-1 m-2 text-gray-400 hover:text-gray-600'
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
      'flex shrink-0 items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 border-l border-gray-200'
    button.setAttribute('aria-label', tooltip)
    button.title = tooltip

    const copySvg = getIconMarkup(copyIcon)
    const checkSvg = getIconMarkup(checkIcon)

    button.innerHTML = `
      <span data-code-tabs-copy-icon="copy">${copySvg}</span>
      <span data-code-tabs-copy-icon="check" class="hidden">${checkSvg}</span>
      <span class="text-sm">${title}</span>
    `

    addButtonEventListeners(button, () => {
      void this.copyActiveCode(button)
    }, this)

    return button
  }

  private setActive(index: number): void {
    this.activeIndex = index

    if (this.codeBlocks.length > 1) {
      this.codeBlocks.forEach((pre, i) => {
        pre.classList.toggle('hidden', i !== index)
      })
    }

    this.tabButtons.forEach((btn, i) => {
      btn.classList.toggle('text-gray-900', i === index)
      btn.classList.toggle('text-gray-400', i !== index)
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
