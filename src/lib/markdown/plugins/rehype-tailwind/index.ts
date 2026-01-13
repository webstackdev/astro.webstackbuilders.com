/**
 * Rehype plugin to automatically add Tailwind classes to markdown-generated HTML elements
 */
import { visit, SKIP } from 'unist-util-visit'
import type { Root, Element, Parent } from 'hast'
import { applyHtmlElementClasses, getElementConfig } from './visitors/simple.js'
import { hasClass, isCodeInline } from './utils.js'

/**
 * Rehype plugin that adds Tailwind CSS classes to HTML elements
 * @returns Transformer function for rehype
 */
export function rehypeTailwindClasses() {
  return (tree: Root) => {
    const parentByNode = new WeakMap<Element, Parent>()

    const getParent = (node: Element): Parent | undefined => parentByNode.get(node)

    visit(tree, 'element', (node: Element, _index, parent): void | typeof SKIP => {
      if (parent) {
        parentByNode.set(node, parent)
      }

      /** Check if this is a simple HTML element from our configuration */
      const elementConfig = getElementConfig(node.tagName)
      if (elementConfig) {
        applyHtmlElementClasses(node, elementConfig)
        return
      }

      /**
       * =============================================================================
       *
       * Anchor link stylings for links within paragraphs, list items, and blockquotes
       *
       * =============================================================================
       */
      if (
        node.tagName === 'a' &&
        node.properties &&
        !hasClass(node, 'btn') &&
        !hasClass(node, 'heading-anchor')
      ) {
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'focus-visible:outline-none',
          'focus:border-2',
          'focus:border-spotlight',
          'focus:outline-none',
          'focus:text-content-active',
          'hover:decoration-content-active',
          'hover:text-content-active',
          'transition-colors',
        ])
      }

      /**
       * =============================================================================
       *
       * Heading stylings with proper spacing and relative positioning
       *
       * =============================================================================
       */
      if (['h2', 'h3', 'h4'].includes(node.tagName)) {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'mb-2',
          'mt-6',
          'relative',
          /**
           * Remove top margin from first child element of headings since we're
           * controlling bottom margin here.
           */
          'first:mt-0',
          /** Used to add hover state to heading anchors with Tailwind's group-* utility. */
          'group',
        ])
      }

      /**
       * =============================================================================
       *
       * Code Block Stylings
       *
       * =============================================================================
       */

      /**
       * Inline code stylings
       */
      if (node.tagName === 'code' && isCodeInline(node, getParent)) {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'bg-gray-100',
          'rounded',
          'border',
          'border-gray-300',
          'inline-block',
          'font-mono',
          'text-xs',
          'mx-1',
          'px-2',
          'py-1',
        ])
      }


      /**
       * Code blocks (pre > code) stylings with responsive margins
       */
      if (node.tagName === 'pre') {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'block',
          'text-base',
          'px-6',
          'py-8',
          'overflow-x-auto',
          'bg-gray-900',
          'text-gray-100',
          'rounded-lg',
          'my-8',
          'lg:px-12',
        ])

        const parentHasNamedFence =
          hasClass(node, 'named-fence-block') || (node.properties?.['data-filename'] as string)

        if (parentHasNamedFence) {
          node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
            'relative',
            'pt-8',
          ])
        }
      }

      /**
       * Named Code Block filename stylings
       */
      if (hasClass(node, 'named-fence-filename')) {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'absolute',
          'top-0',
          'left-0',
          'px-1',
          'font-bold',
          'text-black',
          'bg-gray-300',
          'opacity-60',
          'text-xs',
        ])
      }


      /**
       * Code Tabs container stylings
       */
      if (node.tagName === 'code-tabs') {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'border',
          'border-gray-200',
          'rounded-md',
          'overflow-hidden',
        ])
      }

      /**
       * =============================================================================
       *
       * Iframe embeds are wrapped in a responsive container with styling
       *
       * =============================================================================
       */
      if (node.tagName === 'iframe') {
        /** Create wrapper div with aspect ratio (migrated from .embed class) */
        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: [
              'relative',
              'aspect-video',
              'my-8',
              'rounded-lg',
              'overflow-hidden',
              'shadow-md',
            ],
          },
          children: [
            {
              ...node,
              properties: {
                ...node.properties,
                className: ((node.properties?.['className'] as string[]) || []).concat([
                  'absolute',
                  'inset-0',
                  'w-full',
                  'h-full',
                ]),
              },
            },
          ],
        }

        /** Replace the iframe with the wrapper */
        Object.assign(node, wrapper)

        /** Prevent re-processing the newly-added iframe child (would wrap infinitely) */
        return SKIP
      }

      /**
       * =============================================================================
       *
       * Blockquotes Stylings
       *
       * =============================================================================
       */
      if (node.tagName === 'blockquote') {
        node.properties = node.properties || {}
        /**
         * Check if parent is an attribution quote and abort if so. Attribution
         * quotes won't have classes yet.
         */
        const existingClasses = (node.properties['className'] as string[]) || []
        const isAttributionQuote = existingClasses.length === 0

        if (!isAttributionQuote) {
          node.properties['className'] = existingClasses.concat([
            'border-l-4',
            'border-blue-600',
            'my-8',
            'pl-14',
            '-ml-14',
            'font-serif',
            'text-2xl',
            'italic',
          ])
        }
      }

      /**
       * =============================================================================
       *
       * Attribution Blockquote Stylings
       *
       * =============================================================================
       */
      if (node.tagName === 'figure' && hasClass(node, 'c-blockquote')) {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'relative',
          'my-12',
          'px-8',
          'py-6',
          'rounded-lg',
          'bg-gray-100',
          'dark:bg-gray-800',
          'border-l-4',
          'border-[var(--color-primary)]',
          // Opening quote decoration
          'before:content-["""]',
          'before:absolute',
          'before:top-2',
          'before:left-2',
          'before:text-6xl',
          'before:font-serif',
          'before:leading-none',
          'before:text-[var(--color-primary)]',
          'before:opacity-30',
        ])

        /** Style the blockquote child within the figure */
        if (node.children) {
          visit(node, 'element', (child: Element) => {
            if (child.tagName === 'blockquote') {
              child.properties = child.properties || {}
              child.properties['className'] = [
                'relative',
                'z-(--z-raised)',
                'pl-8',
                'border-0',
                'my-0',
                'font-serif',
                'text-xl',
                'italic',
                'text-[var(--color-content)]',
              ]
            }
          })
        }
      }

      /** Add classes to figcaption with c-blockquote__attribution class */
      if (node.tagName === 'figcaption' && hasClass(node, 'c-blockquote__attribution')) {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'mt-4',
          'pt-4',
          'border-t',
          'border-gray-300',
          'dark:border-gray-600',
          'text-sm',
          'font-sans',
          'italic',
          'text-content-active',
          // Em dash before attribution
          'before:content-["—_"]',
          'before:text-primary',
        ])
      }
    })
  }
}
