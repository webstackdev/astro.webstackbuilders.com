/**
 * Rehype plugin to mimic GitHub's inline color swatch behavior.
 *
 * Rules:
 * - Only applies to inline code (i.e., `code` not within `pre`).
 * - Only applies when the inline code text is a supported CSS color format.
 */
import { visit } from 'unist-util-visit'
import type { Root, Element, Text } from 'hast'

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

// Comma or space separated forms, with optional alpha.
// Examples:
// - rgb(9, 105, 218)
// - rgba(9, 105, 218, 0.5)
// - rgb(9 105 218 / 50%)
const RGB_RE = /^rgba?\(\s*([0-9]{1,3}%?)\s*(?:,|\s)\s*([0-9]{1,3}%?)\s*(?:,|\s)\s*([0-9]{1,3}%?)(?:\s*(?:,|\/)\s*([0-9]*\.?[0-9]+%?))?\s*\)$/i

// Examples:
// - hsl(212, 92%, 45%)
// - hsla(212, 92%, 45%, 0.5)
// - hsl(212 92% 45% / 50%)
const HSL_RE = /^hsla?\(\s*([-+]?[0-9]*\.?[0-9]+)(?:deg|rad|turn|grad)?\s*(?:,|\s)\s*([0-9]{1,3}%?)\s*(?:,|\s)\s*([0-9]{1,3}%?)(?:\s*(?:,|\/)\s*([0-9]*\.?[0-9]+%?))?\s*\)$/i

function isPercent(str: string): boolean {
  return str.trim().endsWith('%')
}

function toNumber(str: string): number {
  return Number(str.trim().replace(/%$/, ''))
}

function isInRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max
}

function isValidRgbComponent(component: string): boolean {
  const value = toNumber(component)
  if (isPercent(component)) return isInRange(value, 0, 100)
  return isInRange(value, 0, 255)
}

function isValidHslPercent(component: string): boolean {
  const value = toNumber(component)
  return isPercent(component) && isInRange(value, 0, 100)
}

function isValidAlpha(alpha: string): boolean {
  const value = toNumber(alpha)
  if (isPercent(alpha)) return isInRange(value, 0, 100)
  return isInRange(value, 0, 1)
}

function isSupportedInlineColor(text: string): boolean {
  const candidate = text.trim()

  if (HEX_RE.test(candidate)) return true

  const rgb = candidate.match(RGB_RE)
  if (rgb) {
    const [, r, g, b, a] = rgb
    if (!r || !g || !b) return false
    if (!isValidRgbComponent(r) || !isValidRgbComponent(g) || !isValidRgbComponent(b)) return false
    if (a && !isValidAlpha(a)) return false
    return true
  }

  const hsl = candidate.match(HSL_RE)
  if (hsl) {
    const [, _h, s, l, a] = hsl
    if (!s || !l) return false
    // Hue accepts a wide range of values in CSS, so we only validate s/l/alpha.
    if (!isValidHslPercent(s) || !isValidHslPercent(l)) return false
    if (a && !isValidAlpha(a)) return false
    return true
  }

  return false
}

function getInlineCodeText(node: Element): string | null {
  let text = ''
  for (const child of node.children || []) {
    if (child.type !== 'text') return null
    text += (child as Text).value
  }
  return text
}

function createSwatch(color: string): Element {
  const inner: Element = {
    type: 'element',
    tagName: 'span',
    properties: {
      'data-color-swatch': 'true',
      style: `background-color: ${color};`,
      className: ['block', 'w-full', 'h-full', 'rounded-sm'],
    },
    children: [],
  }

  return {
    type: 'element',
    tagName: 'span',
    properties: {
      'data-color-swatch-wrapper': 'true',
      ariaHidden: 'true',
      title: color,
      className: [
        'inline-flex',
        'items-center',
        'justify-center',
        'w-3',
        'h-3',
        'p-px',
        'rounded-sm',
        'bg-text-offset',
        'border',
        'border-border',
        'align-middle',
        'ml-1',
      ],
    },
    children: [inner],
  }
}

export function rehypeInlineCodeColorSwatch() {
  return (tree: Root) => {
    const codeInPre = new WeakSet<Element>()

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return

      const children = node.children || []
      for (const child of children) {
        if (child.type === 'element' && (child as Element).tagName === 'code') {
          codeInPre.add(child as Element)
        }
      }
    })

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'code') return
      if (codeInPre.has(node)) return

      const existingChildren = node.children || []
      if (existingChildren.length === 0) return

      // Avoid double-inserting if this runs more than once in a pipeline.
      for (const child of existingChildren) {
        if (child.type !== 'element') continue
        const element = child as Element
        if (element.properties?.['data-color-swatch-wrapper'] === 'true') return
      }

      const text = getInlineCodeText(node)
      if (!text) return

      const candidate = text.trim()
      if (!isSupportedInlineColor(candidate)) return

      node.children = [...existingChildren, createSwatch(candidate)]
    })
  }
}
