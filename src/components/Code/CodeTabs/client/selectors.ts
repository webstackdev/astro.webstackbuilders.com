import { isCodeElement, isPreElement, isSpanElement } from '@components/scripts/assertions/elements'

const SELECTORS = {
  preBlocks: ':scope > pre',
  code: 'code',
  copyIcon: '[data-code-tabs-copy-icon="copy"]',
  checkIcon: '[data-code-tabs-copy-icon="check"]',
} as const

export function queryCodeBlocks(scope: ParentNode): HTMLPreElement[] {
  return Array.from(scope.querySelectorAll(SELECTORS.preBlocks)).filter(
    (node): node is HTMLPreElement => {
      return isPreElement(node)
    }
  )
}

export function queryCodeElement(pre: HTMLPreElement): HTMLElement | null {
  const element = pre.querySelector(SELECTORS.code)
  return isCodeElement(element) ? element : null
}

export function queryCopyIconElement(scope: ParentNode): HTMLElement | null {
  const element = scope.querySelector(SELECTORS.copyIcon)
  return isSpanElement(element) ? element : null
}

export function queryCheckIconElement(scope: ParentNode): HTMLElement | null {
  const element = scope.querySelector(SELECTORS.checkIcon)
  return isSpanElement(element) ? element : null
}

export function hasHighlighterElement(scope: ParentNode = document): boolean {
  return scope.querySelector('highlighter-element') !== null
}

export function hasMastodonModalElement(scope: ParentNode = document): boolean {
  return scope.querySelector('mastodon-modal-element') !== null
}
