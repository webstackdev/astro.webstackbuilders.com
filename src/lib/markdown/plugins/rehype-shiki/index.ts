import type { Root, Element, Parent, Text } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { createHighlighter } from 'shiki'

type ShikiThemes =
  | string
  | {
      light: string
      dark: string
    }

export type RehypeShikiOptions = {
  themes: ShikiThemes
  defaultColor?: 'light' | 'dark' | false
  langAlias?: Record<string, string>
  /**
   * Use Tailwind for wrapping instead of Shiki inline wrap styles.
   * Defaults to false (no wrap).
   */
  wrap?: boolean
  /** Languages that should not be highlighted. */
  excludeLangs?: string[]
}

type HighlighterLike = {
  codeToHast: (
    _code: string,
    _options: {
      lang: string
      themes: ShikiThemes
      defaultColor?: 'light' | 'dark' | false
      wrap?: boolean
    },
  ) => Root | Element
  loadLanguage: (_lang: string) => Promise<void>
}

function getThemeNames(themes: ShikiThemes): string[] {
  if (typeof themes === 'string') return [themes]

  const names = [themes.light, themes.dark].filter(Boolean)
  return Array.from(new Set(names))
}

function toStringArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string') as string[]
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean)
  return []
}

function mergeClassNames(existing: unknown, extra: string[]): string[] {
  const merged = new Set<string>([...toStringArray(existing), ...extra].filter(Boolean))
  return Array.from(merged)
}

function isElement(node: unknown): node is Element {
  return !!node && typeof node === 'object' && (node as Element).type === 'element'
}

function isParent(node: unknown): node is Parent {
  return !!node && typeof node === 'object' && Array.isArray((node as Parent).children)
}

function getText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const typed = node as Partial<Text> & Partial<Parent>

  if (typed.type === 'text') {
    return String((typed as Text).value ?? '')
  }

  if (!Array.isArray(typed.children)) return ''
  return typed.children.map(getText).join('')
}

function parseLanguageFromCode(code: Element): string | null {
  const classNames = toStringArray(code.properties?.['className'])
  const langClass = classNames.find(cn => cn.startsWith('language-'))
  if (langClass) return langClass.replace(/^language-/, '').trim() || null

  const dataLang = code.properties?.['data-language']
  if (typeof dataLang === 'string' && dataLang.trim()) return dataLang.trim()

  return null
}

const DEFAULT_LANG_ALIAS: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
}

function normalizeAliasMap(alias: Record<string, string> | undefined): Record<string, string> {
  if (!alias) return {}
  return Object.fromEntries(
    Object.entries(alias)
      .map(([key, value]) => [key.trim().toLowerCase(), value.trim()])
      .filter(([key, value]) => Boolean(key) && Boolean(value)),
  )
}

function normalizeLanguage(lang: string, alias: Record<string, string> | undefined): string {
  const trimmed = lang.trim()
  if (!trimmed) return trimmed

  const key = trimmed.toLowerCase()
  const mapped = alias?.[key]
  return (mapped ?? key).trim()
}

function hasShikiClass(pre: Element): boolean {
  const classNames = mergeClassNames(pre.properties?.['className'], toStringArray(pre.properties?.['class']))
  return classNames.some(cn => cn === 'shiki' || cn.startsWith('shiki-'))
}

function normalizeShikiProperties(pre: Element): void {
  pre.properties = pre.properties || {}

  const classes = mergeClassNames(pre.properties['className'], toStringArray(pre.properties['class']))
  if (classes.length > 0) {
    pre.properties['className'] = classes
  }
  delete (pre.properties as Record<string, unknown>)['class']

  const tabindex = pre.properties['tabindex']
  if (typeof tabindex === 'string' || typeof tabindex === 'number') {
    const numeric = typeof tabindex === 'number' ? tabindex : Number(tabindex)
    pre.properties['tabIndex'] = Number.isFinite(numeric) ? numeric : 0
    delete (pre.properties as Record<string, unknown>)['tabindex']
  }
}

function getDataPropValue(node: Element | null, attributeName: string): unknown {
  if (!node?.properties) return undefined

  const direct = node.properties[attributeName]
  if (direct !== undefined) return direct

  if (!attributeName.startsWith('data-')) return undefined
  const rest = attributeName.slice('data-'.length)
  if (!rest) return undefined

  const camel = rest
    .split('-')
    .filter(Boolean)
    .map((part, index) => {
      const lower = part.toLowerCase()
      if (index === 0) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')

  const alt = `data${camel.charAt(0).toUpperCase()}${camel.slice(1)}`
  return node.properties[alt]
}

function extractPre(highlighted: Root | Element): Element | null {
  if (isElement(highlighted) && highlighted.tagName === 'pre') return highlighted

  const root = highlighted as Root
  const first = (root.children || []).find(isElement)
  if (first && first.tagName === 'pre') return first

  return null
}

const DEFAULT_EXCLUDED_LANGS = ['mermaid', 'math']

const rehypeShiki: Plugin<[RehypeShikiOptions], Root> = (options: RehypeShikiOptions) => {
  const excluded = new Set([...(options.excludeLangs ?? DEFAULT_EXCLUDED_LANGS)].map(s => s.toLowerCase()))
  const wrap = options.wrap ?? false
  const langAlias = normalizeAliasMap({ ...DEFAULT_LANG_ALIAS, ...(options.langAlias ?? {}) })

  let highlighterPromise: Promise<HighlighterLike> | null = null

  async function getHighlighter(): Promise<HighlighterLike> {
    if (highlighterPromise) return highlighterPromise

    highlighterPromise = (async () => {
      // Shiki requires themes to be loaded before use.
      const highlighter = await createHighlighter({
        themes: getThemeNames(options.themes),
        langs: [],
      })

      return highlighter as unknown as HighlighterLike
    })()

    // If initialization fails (e.g., during a Vite dev-server hot restart where
    // the module runner is being torn down), clear the cached promise so a
    // subsequent transform can retry.
    highlighterPromise = highlighterPromise.catch((error: unknown) => {
      highlighterPromise = null
      throw error
    })

    return highlighterPromise
  }

  return async (tree: Root) => {
    const highlighter = await getHighlighter()

    const replacements: Array<{
      parent: Parent
      index: number
      original: Element
      lang: string
      codeText: string
    }> = []

    visit(tree, 'element', (node: Element, index: number | undefined, parent: Parent | undefined) => {
      if (!parent || index === undefined) return
      if (node.tagName !== 'pre') return
      if (!isParent(parent)) return
      if (hasShikiClass(node)) return

      const codeChild = node.children.find(isElement)
      if (!codeChild || codeChild.tagName !== 'code') return

      const rawLang = parseLanguageFromCode(codeChild)
      if (!rawLang) return

      const lang = normalizeLanguage(rawLang, langAlias)
      if (excluded.has(lang.toLowerCase())) return

      const codeText = getText(codeChild)
      if (!codeText.trim()) return

      replacements.push({ parent, index, original: node, lang, codeText })
    })

    for (const replacement of replacements) {
      try {
        await highlighter.loadLanguage(replacement.lang)
      } catch {
        // Unknown language; keep original markup.
        continue
      }

      const shikiOptions: {
        lang: string
        themes: ShikiThemes
        defaultColor?: 'light' | 'dark' | false
        wrap?: boolean
      } = {
        lang: replacement.lang,
        themes: options.themes,
        wrap: false,
      }

      if (options.defaultColor !== undefined) {
        shikiOptions.defaultColor = options.defaultColor
      }

      const highlighted = highlighter.codeToHast(replacement.codeText, shikiOptions)
      const highlightedPre = extractPre(highlighted)
      if (!highlightedPre) continue

      normalizeShikiProperties(highlightedPre)

      // Preserve existing properties from the original <pre> (not classes; those are merged).
      const existingProps = replacement.original.properties || {}
      highlightedPre.properties = highlightedPre.properties || {}

      // Some pipelines attach custom data props to the <code> child rather than the <pre>.
      // Promote them onto the <pre> so downstream consumers (like <code-tabs>) can rely on them.
      const originalCodeChild = replacement.original.children.find(isElement) || null
      for (const key of ['data-code-tabs-group', 'data-code-tabs-tab']) {
        const fromPre = existingProps[key]
        const fromCode = getDataPropValue(originalCodeChild, key)
        const value = fromPre ?? fromCode
        if (value !== undefined) highlightedPre.properties[key] = value as never
      }

      for (const [key, value] of Object.entries(existingProps)) {
        if (key === 'className' || key === 'class') continue
        if (key === 'data-code-tabs-group' || key === 'data-code-tabs-tab') continue
        highlightedPre.properties[key] = value as never
      }

      highlightedPre.properties['tabIndex'] = 0
      highlightedPre.properties['data-language'] = replacement.lang

      highlightedPre.properties['className'] = mergeClassNames(
        highlightedPre.properties['className'],
        [
          'overflow-x-auto',
          wrap ? 'whitespace-pre-wrap' : 'whitespace-pre',
        ],
      )

      replacement.parent.children[replacement.index] = highlightedPre
    }
  }
}

export default rehypeShiki
