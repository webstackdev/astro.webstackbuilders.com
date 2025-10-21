/**
 * Type definitions for rehype-tailwind plugin
 */
import type { Element } from 'hast'

/**
 * Configuration for a simple HTML element with classes
 */
export interface ElementConfig {
  /** The HTML tag name */
  tagName: string
  /** Array of Tailwind CSS classes to apply */
  classes: string[]
}

/**
 * Visitor pattern for conditional element handling
 */
export interface ConditionalVisitor {
  /** Human-readable name for the visitor */
  name: string
  /** Check if this visitor should handle the node */
  matches: (_node: Element) => boolean
  /** Apply classes to the node */
  apply: (_node: Element) => void
}

/**
 * Visitor pattern for simple element handling
 */
export interface SimpleVisitor {
  /** Human-readable name for the visitor */
  name: string
  /** Array of element configurations */
  elements: ElementConfig[]
  /** Check if node matches any element in this visitor */
  matches: (_node: Element) => boolean
  /** Apply classes to matching node */
  apply: (_node: Element) => void
}
