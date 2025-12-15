/**
 * Remark plugin to implement SmartyPants typography.
 *
 * Behavior:
 * - Straight quotes -> curly quotes
 * - ``like this'' -> curly quotes
 * - -- / --- -> en / em dashes (via `dashes: 'oldschool'`)
 * - ... / . . . -> ellipsis
 *
 * Safety:
 * - Only transforms `text` nodes (preserves code blocks, inline code, and raw HTML)
 * - Skips processing inside certain MDX/HTML tags (`pre`, `code`, `kbd`, `math`, `script`, `style`)
 */

import type { Root, Parent, Content, Html } from 'mdast'
import type { Plugin } from 'unified'

import type { Options as RetextSmartypantsOptions } from 'retext-smartypants'

export type RemarkSmartypantsOptions = RetextSmartypantsOptions

const DEFAULT_OPTIONS: RemarkSmartypantsOptions = {
  backticks: true,
  closingQuotes: { double: '\u201D', single: '\u2019' },
  dashes: 'oldschool',
  ellipses: true,
  openingQuotes: { double: '\u201C', single: '\u2018' },
  quotes: true,
}

const IGNORED_MDX_ELEMENTS = new Set(['pre', 'code', 'kbd', 'math', 'script', 'style'])

function isIgnoredMdxTextElementParent(parent: unknown): boolean {
  if (!parent || typeof parent !== 'object') return false
  if (!('type' in parent) || (parent as { type?: unknown }).type !== 'mdxJsxTextElement') return false
  const name = (parent as { name?: unknown }).name
  return typeof name === 'string' && IGNORED_MDX_ELEMENTS.has(name)
}

type CharClass = 'none' | 'space' | 'word' | 'punct'

type TransformState = {
  prevClass: CharClass
  openDouble: boolean
  openSingle: boolean
}

const DEFAULT_STATE: TransformState = {
  prevClass: 'none',
  openDouble: false,
  openSingle: false,
}

function isWordChar(char: string): boolean {
  return /[0-9A-Za-z]/.test(char)
}

function classifyChar(char: string): CharClass {
  if (!char) return 'none'
  if (/\s/.test(char)) return 'space'
  if (isWordChar(char)) return 'word'
  return 'punct'
}

function shouldOpenQuote(state: TransformState, nextChar: string): boolean {
  const nextClass = classifyChar(nextChar)
  if (state.prevClass === 'none') return true
  if (state.prevClass === 'space') return true
  // If the next thing is space/punct, prefer closing.
  if (nextClass === 'space' || nextClass === 'punct' || nextClass === 'none') return false
  // Default: opening when we're not "in" a quote yet.
  return true
}

function resolveDashOptions(options: RemarkSmartypantsOptions): {
  emDash: string
  enDash: string
  mode: 'default' | 'oldschool' | 'inverted' | 'off'
} {
  const mode = options.dashes === false
    ? 'off'
    : options.dashes === 'oldschool'
      ? 'oldschool'
      : options.dashes === 'inverted'
        ? 'inverted'
        : 'default'

  return { emDash: '—', enDash: '–', mode }
}

function transformTextValue(value: string, options: RemarkSmartypantsOptions, state: TransformState): string {
  const openingDouble = options.openingQuotes?.double ?? DEFAULT_OPTIONS.openingQuotes?.double ?? '\u201C'
  const openingSingle = options.openingQuotes?.single ?? DEFAULT_OPTIONS.openingQuotes?.single ?? '\u2018'
  const closingDouble = options.closingQuotes?.double ?? DEFAULT_OPTIONS.closingQuotes?.double ?? '\u201D'
  const closingSingle = options.closingQuotes?.single ?? DEFAULT_OPTIONS.closingQuotes?.single ?? '\u2019'
  const dash = resolveDashOptions(options)

  const enableQuotes = options.quotes !== false
  const enableBackticks = options.backticks !== false
  const enableEllipses = options.ellipses !== false

  const out: string[] = []
  let index = 0

  const get = (offset: number): string => value[index + offset] ?? ''

  while (index < value.length) {
    const char = get(0)
    const next = get(1)
    const next2 = get(2)

    // Ellipses: ". . ." or "..."
    if (enableEllipses) {
      if (char === '.' && next === '.' && next2 === '.') {
        out.push('…')
        state.prevClass = 'punct'
        index += 3
        continue
      }

      if (
        char === '.' &&
        next === ' ' &&
        next2 === '.' &&
        get(3) === ' ' &&
        get(4) === '.'
      ) {
        out.push('…')
        state.prevClass = 'punct'
        index += 5
        continue
      }
    }

    // Dashes
    if (dash.mode !== 'off') {
      if (char === '-' && next === '-' && next2 === '-') {
        if (dash.mode === 'oldschool') out.push(dash.emDash)
        else if (dash.mode === 'inverted') out.push(dash.enDash)
        else out.push(dash.emDash)
        state.prevClass = 'punct'
        index += 3
        continue
      }
      if (char === '-' && next === '-') {
        if (dash.mode === 'oldschool') out.push(dash.enDash)
        else if (dash.mode === 'inverted') out.push(dash.emDash)
        else out.push(dash.emDash)
        state.prevClass = 'punct'
        index += 2
        continue
      }
    }

    // Backticks-style quotes: ``like this''
    if (enableBackticks) {
      if (char === '`' && next === '`') {
        out.push(openingDouble)
        state.prevClass = 'punct'
        state.openDouble = true
        index += 2
        continue
      }
      if (char === '\'' && next === '\'') {
        out.push(closingDouble)
        state.prevClass = 'punct'
        state.openDouble = false
        index += 2
        continue
      }
    }

    // Straight quotes
    if (enableQuotes && char === '"') {
      const open = shouldOpenQuote(state, next)
      if (open) {
        out.push(openingDouble)
        state.openDouble = true
      } else {
        out.push(closingDouble)
        state.openDouble = false
      }
      state.prevClass = 'punct'
      index += 1
      continue
    }

    // Straight single quotes / apostrophes
    if (enableQuotes && char === "'") {
      const prevClass = state.prevClass
      const nextClass = classifyChar(next)

      // Apostrophe in a word (don't, you're)
      if (prevClass === 'word' && nextClass === 'word') {
        out.push(closingSingle)
        state.prevClass = 'punct'
        index += 1
        continue
      }

      const open = shouldOpenQuote(state, next)
      if (open) {
        out.push(openingSingle)
        state.openSingle = true
      } else {
        out.push(closingSingle)
        state.openSingle = false
      }

      state.prevClass = 'punct'
      index += 1
      continue
    }

    out.push(char)
    state.prevClass = classifyChar(char)
    index += 1
  }

  return out.join('')
}

function isHtmlNode(node: unknown): node is Html {
  return !!node && typeof node === 'object' && (node as { type?: unknown }).type === 'html'
}

const RAW_HTML_IGNORED_TAGS = new Set(['pre', 'code', 'kbd', 'math', 'script', 'style'])

function parseHtmlTag(value: string): { tag: string; kind: 'open' | 'close' } | null {
  const trimmed = value.trim()
  const openMatch = /^<([A-Za-z][A-Za-z0-9-]*)(\s|>|\/)/.exec(trimmed)
  if (openMatch && openMatch[1]) return { tag: openMatch[1].toLowerCase(), kind: 'open' }

  const closeMatch = /^<\/([A-Za-z][A-Za-z0-9-]*)\s*>/.exec(trimmed)
  if (closeMatch && closeMatch[1]) return { tag: closeMatch[1].toLowerCase(), kind: 'close' }

  return null
}

function shouldSkipTextInRawHtml(stack: string[]): boolean {
  return stack.length > 0
}

function walkParent(
  parent: Parent,
  options: RemarkSmartypantsOptions,
  state: TransformState,
  rawHtmlStack: string[]
): void {
  for (const child of parent.children as Content[]) {
    // Skip subtree for MDX text elements like <code> in MDX.
    if (child && typeof child === 'object' && (child as { type?: unknown }).type === 'mdxJsxTextElement') {
      const name = (child as { name?: unknown }).name
      if (typeof name === 'string' && IGNORED_MDX_ELEMENTS.has(name)) {
        continue
      }
    }

    if (isHtmlNode(child)) {
      const parsed = parseHtmlTag(child.value)
      if (parsed && RAW_HTML_IGNORED_TAGS.has(parsed.tag)) {
        if (parsed.kind === 'open') rawHtmlStack.push(parsed.tag)
        if (parsed.kind === 'close') {
          const index = rawHtmlStack.lastIndexOf(parsed.tag)
          if (index !== -1) rawHtmlStack.splice(index, 1)
        }
      }
      continue
    }

    if (child.type === 'inlineCode') {
      // Inline code is "content" for quote closing, but we never modify it.
      state.prevClass = 'word'
      continue
    }

    if (child.type === 'code') {
      // Code blocks are content but should not influence quotes outside.
      // Treat as a boundary.
      state.prevClass = 'none'
      continue
    }

    if (child.type === 'text') {
      if (!shouldSkipTextInRawHtml(rawHtmlStack) && !isIgnoredMdxTextElementParent(parent)) {
        child.value = transformTextValue(child.value, options, state)
      }
      continue
    }

    if ((child as unknown as Parent).children && Array.isArray((child as unknown as Parent).children)) {
      // Reset quote state at new block boundaries.
      if (child.type === 'paragraph' || child.type === 'heading') {
        state.prevClass = 'none'
        state.openDouble = false
        state.openSingle = false
      }
      walkParent(child as unknown as Parent, options, state, rawHtmlStack)
      continue
    }
  }
}

const remarkSmartypants: Plugin<[RemarkSmartypantsOptions?], Root> = (options) => {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...(options ?? {}) }

  return (tree) => {
    // Keep traversal order deterministic; we mutate text nodes in-place.
    const state: TransformState = { ...DEFAULT_STATE }
    const rawHtmlStack: string[] = []
    walkParent(tree as unknown as Parent, resolvedOptions, state, rawHtmlStack)
  }
}

export default remarkSmartypants
