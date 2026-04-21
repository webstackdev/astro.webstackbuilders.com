import { visit } from 'unist-util-visit'
import type { Root, Element, ElementContent, Text } from 'hast'

function isElementNode(node: ElementContent): node is Element {
  return node.type === 'element'
}

function getClassNames(node: Element): string[] {
  const className = node.properties?.['className']

  if (Array.isArray(className)) {
    return className.filter((value): value is string => typeof value === 'string')
  }

  if (typeof className === 'string') {
    return [className]
  }

  return []
}

function getTextContent(node: Element): string {
  let textContent = ''

  for (const child of node.children) {
    if (child.type === 'text') {
      textContent += (child as Text).value
      continue
    }

    if (isElementNode(child)) {
      textContent += getTextContent(child)
    }
  }

  return textContent
}

function normalizeMathSource(source: string): string {
  return source.replace(/\s+/g, ' ').trim()
}

function isMathCode(node: Element): boolean {
  return node.tagName === 'code' && getClassNames(node).includes('language-math')
}

function createWrapper(tagName: 'div' | 'span', source: string, child: Element): Element {
  return {
    type: 'element',
    tagName,
    properties: {
      dataMathSource: source,
    },
    children: [child],
  }
}

/**
 * Preserve the original TeX source around math placeholders so a later rehype
 * step can add accessible text to the MathJax SVG output.
 */
export function rehypeMathjaxSource() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (index === undefined || !parent || !Array.isArray(parent.children)) {
        return
      }

      if (parent.type === 'element' && 'dataMathSource' in (parent.properties || {})) {
        return
      }

      if (node.tagName === 'pre') {
        const firstChild = node.children[0]

        if (!firstChild || !isElementNode(firstChild) || !isMathCode(firstChild)) {
          return
        }

        const source = normalizeMathSource(getTextContent(firstChild))
        if (!source) {
          return
        }

        parent.children[index] = createWrapper('div', source, node)
        return
      }

      if (!isMathCode(node)) {
        return
      }

      const source = normalizeMathSource(getTextContent(node))
      if (!source) {
        return
      }

      parent.children[index] = createWrapper('span', source, node)
    })
  }
}

export default rehypeMathjaxSource
