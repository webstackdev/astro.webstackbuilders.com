import type { Element, Parent, Root, Text } from 'hast'
import type { Plugin } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

type TabInfo = {
  group: string
  tab: string
}

const EXCLUDED_SINGLE_WRAP_LANGS = new Set(['mermaid', 'math', 'text'])

function toDataPropName(attributeName: string): string | null {
  // Convert `data-foo-bar` -> `dataFooBar` (some pipelines normalize this way)
  if (!attributeName.startsWith('data-')) return null
  const rest = attributeName.slice('data-'.length)
  if (!rest) return null

  const camel = rest
    .split('-')
    .filter(Boolean)
    .map((part, index) => {
      const lower = part.toLowerCase()
      if (index === 0) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')

  return `data${camel.charAt(0).toUpperCase()}${camel.slice(1)}`
}

function toStringProp(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return null
}

function getProp(node: Element, name: string): string | null {
  const direct = toStringProp(node.properties?.[name])
  if (direct) return direct

  const alt = toDataPropName(name)
  if (!alt) return null
  return toStringProp(node.properties?.[alt])
}

function getTabInfoFromPre(pre: Element): TabInfo | null {
  const group = getProp(pre, 'data-code-tabs-group')
  const tab = getProp(pre, 'data-code-tabs-tab')

  if (group && tab) {
    pre.properties = pre.properties || {}
    pre.properties['data-code-tabs-group'] = group
    pre.properties['data-code-tabs-tab'] = tab
    return { group, tab }
  }

  const codeChild = pre.children.find((child): child is Element => {
    return !!child && typeof child === 'object' && (child as Element).type === 'element'
  })

  if (!codeChild) return null

  const childGroup = getProp(codeChild, 'data-code-tabs-group')
  const childTab = getProp(codeChild, 'data-code-tabs-tab')

  if (!childGroup || !childTab) return null

  pre.properties = pre.properties || {}
  pre.properties['data-code-tabs-group'] = childGroup
  pre.properties['data-code-tabs-tab'] = childTab

  // Normalize alternate property names onto the standard data-* form.
  const altGroup = toDataPropName('data-code-tabs-group')
  const altTab = toDataPropName('data-code-tabs-tab')
  if (altGroup && pre.properties[altGroup] === undefined) pre.properties[altGroup] = childGroup
  if (altTab && pre.properties[altTab] === undefined) pre.properties[altTab] = childTab

  return { group: childGroup, tab: childTab }
}

function isParent(node: unknown): node is Parent {
  return !!node && typeof node === 'object' && Array.isArray((node as Parent).children)
}

function isElement(node: unknown): node is Element {
  return !!node && typeof node === 'object' && (node as Element).type === 'element'
}

function isWhitespaceText(node: unknown): node is Text {
  return !!node && typeof node === 'object' && (node as Text).type === 'text' && !((node as Text).value || '').trim()
}

function getLanguageFromCode(code: Element): string | null {
  const classNames = nodeToStringArray(code.properties?.['className'])
  const langClass = classNames.find(cn => cn.startsWith('language-'))
  if (langClass) return langClass.replace(/^language-/, '').trim() || null

  const dataLang = code.properties?.['data-language']
  if (typeof dataLang === 'string' && dataLang.trim()) return dataLang.trim()

  return null
}

function nodeToStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(entry => String(entry))
  if (typeof value === 'string' && value.trim()) return value.trim().split(/\s+/g)
  return []
}

function getLanguageFromPre(pre: Element): string | null {
  const dataLang = pre.properties?.['data-language']
  if (typeof dataLang === 'string' && dataLang.trim()) return dataLang.trim()

  const altLang = pre.properties?.['dataLanguage']
  if (typeof altLang === 'string' && altLang.trim()) return altLang.trim()

  const codeChild = pre.children.find((child): child is Element => isElement(child) && child.tagName === 'code')
  if (!codeChild) return null

  return getLanguageFromCode(codeChild)
}

function shouldSkipSingleWrap(pre: Element): boolean {
  const lang = getLanguageFromPre(pre)
  if (!lang) return false
  return EXCLUDED_SINGLE_WRAP_LANGS.has(lang.toLowerCase())
}

function wrapCodeTabRuns(parent: Parent): void {
  if (isElement(parent) && parent.tagName === 'code-tabs') return

  const children = parent.children

  for (let i = 0; i < children.length; i += 1) {
    const first = children[i]
    if (!isElement(first) || first.tagName !== 'pre') continue

    const startInfo = getTabInfoFromPre(first)
    if (!startInfo) continue

    const run: Element[] = []

    let lastIndex = i
    for (let j = i; j < children.length; j += 1) {
      const current = children[j]

      if (isWhitespaceText(current)) {
        lastIndex = j
        continue
      }

      if (!isElement(current) || current.tagName !== 'pre') break

      const info = getTabInfoFromPre(current)
      if (!info || info.group !== startInfo.group) break

      run.push(current)
      lastIndex = j
    }

    if (run.length < 2) continue

    const wrapper: Element = {
      type: 'element',
      tagName: 'code-tabs',
      properties: {
        className: ['code-tabs'],
        'data-code-tabs-group': startInfo.group,
      },
      children: run,
    }

    children.splice(i, lastIndex - i + 1, wrapper)
  }
}

function wrapStandaloneCodeBlocks(parent: Parent): void {
  if (isElement(parent) && parent.tagName === 'code-tabs') return

  const children = parent.children

  for (let i = 0; i < children.length; i += 1) {
    const node = children[i]
    if (!isElement(node) || node.tagName !== 'pre') continue
    if (shouldSkipSingleWrap(node)) continue

    const info = getTabInfoFromPre(node)
    const wrapper: Element = {
      type: 'element',
      tagName: 'code-tabs',
      properties: {
        className: ['code-tabs'],
        ...(info ? { 'data-code-tabs-group': info.group } : {}),
      },
      children: [node],
    }

    children.splice(i, 1, wrapper)
  }
}

const rehypeCodeTabs: Plugin<[], Root> = () => {
  return tree => {
    wrapCodeTabRuns(tree as unknown as Parent)
    wrapStandaloneCodeBlocks(tree as unknown as Parent)

    visit(tree, 'element', (node: Element): typeof SKIP | void => {
      if (node.tagName === 'code-tabs') return SKIP
      if (!isParent(node)) return
      wrapCodeTabRuns(node)
      wrapStandaloneCodeBlocks(node)
    })
  }
}

export default rehypeCodeTabs
