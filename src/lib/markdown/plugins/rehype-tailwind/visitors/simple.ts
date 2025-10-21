/**
 * HTML element class definitions for simple elements with no conditional logic
 * These are pure element -> classes mappings with no additional checks
 */
import type { Element } from 'hast'
import type { ElementConfig } from '../@types/index.js'
import { applyClasses } from '../utilities/index.js'

/**
 * Simple HTML elements configuration
 * These elements have no conditional logic - just tag name -> classes mapping
 */
export const htmlElements: ElementConfig[] = [
  {
    tagName: 'p',
    classes: ['mb-8', 'text-lg', 'leading-relaxed'],
  },
  {
    tagName: 'img',
    classes: [
      'block',
      'mx-auto',
      'mb-8',
      'max-w-full',
      'h-auto',
      'rounded-lg',
      'shadow-md',
      'text-gray-500',
      'italic',
      'text-center',
    ],
  },
  {
    tagName: 'video',
    classes: [
      'block',
      'mx-auto',
      'mb-8',
      'max-w-full',
      'h-auto',
      'rounded-lg',
      'shadow-md',
      'text-gray-500',
      'italic',
      'text-center',
    ],
  },
  {
    tagName: 'figure',
    classes: ['my-8', 'mx-auto', 'max-w-none', 'text-center'],
  },
  {
    tagName: 'figcaption',
    classes: ['text-base', 'italic', 'pt-3'],
  },
  {
    tagName: 'hr',
    classes: [
      'bg-gray-300',
      'border-0',
      'border-gray-300',
      'my-16',
      'mx-auto',
      'text-center',
      'w-96',
      'h-px',
    ],
  },
  {
    tagName: 'ul',
    classes: ['list-disc', 'list-outside', 'pl-4', 'mb-8'],
  },
  {
    tagName: 'ol',
    classes: ['list-decimal', 'list-outside', 'pl-4', 'mb-8'],
  },
  {
    tagName: 'li',
    classes: ['mb-1', 'last:mb-0'],
  },
  {
    tagName: 'mark',
    classes: ['bg-gray-300', 'text-gray-900'],
  },
  {
    tagName: 'table',
    classes: [
      'w-full',
      'border-collapse',
      'border',
      'border-gray-300',
      'dark:border-gray-600',
      'my-6',
      'rounded-lg',
      'overflow-hidden',
    ],
  },
  {
    tagName: 'th',
    classes: [
      'bg-gray-100',
      'dark:bg-gray-700',
      'px-4',
      'py-2',
      'text-left',
      'font-semibold',
      'border-b',
      'border-gray-300',
      'dark:border-gray-600',
    ],
  },
  {
    tagName: 'td',
    classes: ['px-4', 'py-2', 'border-b', 'border-gray-200', 'dark:border-gray-700'],
  },
  {
    tagName: 'summary',
    classes: ['outline-none', 'select-none', 'cursor-pointer', 'list-none', 'marker:hidden'],
  },
  {
    tagName: 'details',
    classes: ['[&>*:not(summary)]:pl-5'],
  },
]

/**
 * Apply classes to a simple HTML element node
 * @param node - The HAST element node to modify
 * @param config - The configuration object with classes to apply
 */
export function applyHtmlElementClasses(node: Element, config: ElementConfig): void {
  applyClasses(node, config.classes)
}

/**
 * Check if a node matches a simple HTML element configuration
 * @param node - The HAST element node to check
 * @param tagName - The tag name to match
 * @returns True if the node matches the tag name
 */
export function isSimpleHtmlElement(node: Element, tagName: string): boolean {
  return node.tagName === tagName
}

/**
 * Get HTML element configuration by tag name
 * @param tagName - The HTML tag name
 * @returns The configuration object or undefined if not found
 */
export function getElementConfig(tagName: string): ElementConfig | undefined {
  return htmlElements.find((config) => config.tagName === tagName)
}
