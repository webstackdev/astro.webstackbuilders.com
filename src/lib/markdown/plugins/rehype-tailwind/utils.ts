/**
 * Utility functions for rehype-tailwind plugin
 */
import type { Element, Parent } from 'hast'

/**
 * Helper function to check if an element has a specific class
 * @param node - The HAST element node
 * @param className - The class name to check for
 * @returns True if the element has the class, false otherwise
 */
export function hasClass(node: Element, className: string): boolean {
  const classes = node.properties?.['className'] as string[] | string | undefined
  if (Array.isArray(classes)) {
    return classes.includes(className)
  }
  if (typeof classes === 'string') {
    return classes.split(' ').includes(className)
  }
  return false
}

/**
 * Helper function to apply classes to a node, concatenating with existing classes
 * @param node - The HAST element node
 * @param classes - Array of class names to add
 */
export function applyClasses(node: Element, classes: string[]): void {
  node.properties = node.properties || {}
  node.properties['className'] = ((node.properties['className'] as string[]) || []).concat(classes)
}

/**
 * Helper function to check whether a <code> element is inline (i.e. not nested in a <pre>).
 */
export function isCodeInline(
  node: Element,
  getParent: (_node: Element) => Parent | undefined
): boolean {
  if (node.tagName !== 'code') return false

  let current: Parent | undefined = getParent(node)

  while (current) {
    if (isElement(current) && current.tagName === 'pre') {
      return false
    }

    if (!isElement(current)) {
      return true
    }

    current = getParent(current)
  }

  return true
}

function isElement(node: unknown): node is Element {
  return !!node && typeof node === 'object' && (node as Element).type === 'element'
}
