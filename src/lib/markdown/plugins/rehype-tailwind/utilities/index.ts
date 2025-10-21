/**
 * Utility functions for rehype-tailwind plugin
 */
import type { Element } from 'hast'

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
 * Helper function to check if a code element is within a pre element
 * Note: This is a simplified check - in a real implementation you'd need to traverse up the tree
 * @param _node - The HAST element node (currently unused)
 * @returns False for now (placeholder for future implementation)
 */
export function isWithinPre(_node: Element): boolean {
  // This is a simplified check - in a real implementation you'd need to traverse up the tree
  // For now, we'll rely on the pre > code selector being handled separately
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
