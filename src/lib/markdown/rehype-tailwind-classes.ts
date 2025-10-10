/**
 * Rehype plugin to automatically add Tailwind classes to markdown-generated HTML elements
 * Migrated from _content.scss to provide automatic styling for rendered markdown content
 */
import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

export function rehypeTailwindClasses() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      // Add classes to paragraphs with spacing and link styling
      if (node.tagName === 'p') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'mb-8', 'text-lg', 'leading-relaxed'
        ])
      }

      // Add classes to links within paragraphs, list items, and blockquotes
      if (node.tagName === 'a' && node.properties && !hasClass(node, 'btn')) {
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'border-b', 'border-current', 'shadow-[inset_0_-2px_0_0_currentColor]',
          'hover:border-blue-600', 'hover:shadow-[inset_0_-2px_0_0_theme(colors.blue.600)]',
          'hover:text-gray-900', 'focus:border-blue-600', 'focus:shadow-[inset_0_-2px_0_0_theme(colors.blue.600)]',
          'focus:text-gray-900', 'focus:outline-none', 'transition-colors'
        ])
      }

      // Add classes to images with responsive behavior and centering
      if (node.tagName === 'img') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'block', 'mx-auto', 'mb-8', 'max-w-full', 'h-auto', 'rounded-lg', 'shadow-md',
          'text-gray-500', 'italic', 'text-center'
        ])
      }

      // Add classes to videos with responsive behavior and centering
      if (node.tagName === 'video') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'block', 'mx-auto', 'mb-8', 'max-w-full', 'h-auto', 'rounded-lg', 'shadow-md',
          'text-gray-500', 'italic', 'text-center'
        ])
      }

      // Add classes to figures
      if (node.tagName === 'figure') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'my-8', 'mx-auto', 'max-w-none', 'text-center'
        ])
      }

      // Add classes to figcaptions
      if (node.tagName === 'figcaption') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'text-base', 'italic', 'pt-3'
        ])
      }

      // Add classes to horizontal rules
      if (node.tagName === 'hr') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'bg-gray-300', 'border-0', 'border-gray-300', 'my-16', 'mx-auto', 'text-center', 'w-96', 'h-px'
        ])
      }

      // Add classes to headings with proper spacing and relative positioning
      if (['h2', 'h3', 'h4'].includes(node.tagName)) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'mb-2', 'mt-6', 'relative', 'first:mt-0',
          // Add hover state for heading anchors
          'group'
        ])
      }

      // Add classes to anchor links within headings (heading-anchor class replacement)
      if (node.tagName === 'a' && hasClass(node, 'heading-anchor')) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          // Hide by default, show on medium screens and up
          'hidden', 'md:block',
          // Positioning
          'absolute', '-left-4', 'top-0', 'w-4',
          // Opacity and transitions
          'opacity-0', 'group-hover:opacity-75', 'hover:!opacity-100', 'focus:!opacity-100',
          // Remove default link styling
          'border-0', 'shadow-none'
        ])
      }

      // Add classes to unordered lists
      if (node.tagName === 'ul') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'list-disc', 'list-outside', 'pl-4', 'mb-8'
        ])
      }

      // Add classes to ordered lists
      if (node.tagName === 'ol') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'list-decimal', 'list-outside', 'pl-4', 'mb-8'
        ])
      }

      // Add classes to list items with spacing
      if (node.tagName === 'li') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'mb-1', 'last:mb-0'
        ])
      }

      // Add classes to inline code
      if (node.tagName === 'code' && !isWithinPre(node)) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'bg-gray-100', 'rounded', 'border', 'border-gray-300', 'inline-block',
          'font-mono', 'text-xs', 'mx-1', 'px-2', 'py-1'
        ])
      }

      // Add classes to mark elements
      if (node.tagName === 'mark') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'bg-gray-300', 'text-gray-900'
        ])
      }

      // Handle iframe embeds - wrap them in a responsive container with embed styles
      if (node.tagName === 'iframe') {
        // Create wrapper div with aspect ratio (migrated from .embed class)
        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['relative', 'aspect-video', 'my-8', 'rounded-lg', 'overflow-hidden', 'shadow-md']
          },
          children: [{
            ...node,
            properties: {
              ...node.properties,
              'className': (node.properties?.['className'] as string[] || []).concat([
                'absolute', 'inset-0', 'w-full', 'h-full'
              ])
            }
          }]
        }

        // Replace the iframe with the wrapper
        Object.assign(node, wrapper)
      }

      // Add classes to blockquotes (migrated from .content blockquote)
      if (node.tagName === 'blockquote') {
        node.properties = node.properties || {}
        // Check if parent might be a c-blockquote figure (will be styled differently)
        const existingClasses = (node.properties['className'] as string[] || [])
        const isAttributionQuote = existingClasses.length === 0 // Attribution quotes won't have classes yet

        if (!isAttributionQuote) {
          node.properties['className'] = existingClasses.concat([
            'border-l-4', 'border-blue-600', 'my-8', 'pl-14', '-ml-14',
            'font-serif', 'text-2xl', 'italic'
          ])
        }
      }

      // Add classes to figure elements with c-blockquote class (attribution blockquotes)
      if (node.tagName === 'figure' && hasClass(node, 'c-blockquote')) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'relative', 'my-12', 'px-8', 'py-6', 'rounded-lg',
          'bg-gray-100', 'dark:bg-gray-800',
          'border-l-4', 'border-[var(--color-primary)]',
          // Opening quote decoration
          'before:content-["""]', 'before:absolute', 'before:top-2', 'before:left-2',
          'before:text-6xl', 'before:font-serif', 'before:leading-none',
          'before:text-[var(--color-primary)]', 'before:opacity-30'
        ])

        // Style the blockquote child within the figure
        if (node.children) {
          visit(node, 'element', (child: Element) => {
            if (child.tagName === 'blockquote') {
              child.properties = child.properties || {}
              child.properties['className'] = [
                'relative', 'z-10', 'pl-8', 'border-0', 'my-0',
                'font-serif', 'text-xl', 'italic', 'text-[var(--color-text)]'
              ]
            }
          })
        }
      }

      // Add classes to figcaption with c-blockquote__attribution class
      if (node.tagName === 'figcaption' && hasClass(node, 'c-blockquote__attribution')) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'mt-4', 'pt-4', 'border-t', 'border-gray-300', 'dark:border-gray-600',
          'text-sm', 'font-sans', 'italic', 'text-[var(--color-text-offset)]',
          // Em dash before attribution
          'before:content-["—_"]', 'before:text-[var(--color-primary)]'
        ])
      }

      // Add classes to code blocks (pre > code) with responsive margins
      if (node.tagName === 'pre') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'block', 'text-base', 'px-6', 'py-8', 'overflow-x-auto',
          'bg-gray-900', 'text-gray-100', 'rounded-lg', 'my-8',
          'lg:px-12'
        ])

        // Handle named code blocks (from _namedCodeBlock.scss)
        const parentHasNamedFence = hasClass(node, 'named-fence-block') ||
          (node.properties?.['data-filename'] as string)

        if (parentHasNamedFence) {
          node.properties['className'] = (node.properties['className'] as string[] || []).concat([
            'relative', 'pt-8'
          ])
        }
      }

      // Handle vendor-specific markdown elements

      // Code tabs (from _codetab.scss) - container
      if (hasClass(node, 'code-tabs')) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'border', 'border-gray-200', 'rounded-md', 'overflow-hidden'
        ])
      }

      // Code tabs - hide inputs and pre elements by default
      if (node.tagName === 'input' && isWithinCodeTabs(node)) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'hidden'
        ])
      }

      // Code tabs - show pre when input is checked (handled via CSS)
      if (node.tagName === 'pre' && isWithinCodeTabs(node)) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'hidden', 'peer-checked:block'
        ])
      }

      // Code tabs - tab navigation list
      if (node.tagName === 'ul' && isWithinCodeTabs(node)) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'p-0', 'whitespace-nowrap', 'overflow-auto', 'select-none',
          'border-b', 'border-gray-200', 'bg-gray-50'
        ])
      }

      // Code tabs - individual tab items
      if (node.tagName === 'li' && isWithinCodeTabs(node)) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'list-none', 'inline-block', 'relative'
        ])
      }

      // Code tabs - tab labels
      if (node.tagName === 'label' && isWithinCodeTabs(node)) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'cursor-pointer', 'select-none', 'inline-block',
          'px-2', 'py-1', 'm-2', 'text-gray-400',
          'hover:text-gray-600', 'peer-checked:text-gray-900'
        ])
      }

      // Expandable details/summary (from _expandable.scss)
      if (node.tagName === 'summary') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'outline-none', 'select-none', 'cursor-pointer',
          'list-none', 'marker:hidden'
        ])
      }

      // Details content padding
      if (node.tagName === 'details') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          '[&>*:not(summary)]:pl-5'
        ])
      }

      // Named code block filename (from _namedCodeBlock.scss)
      if (hasClass(node, 'named-fence-filename')) {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'absolute', 'top-0', 'left-0', 'px-1',
          'font-bold', 'text-black', 'bg-gray-300',
          'opacity-60', 'text-xs'
        ])
      }

      // Share highlight custom element (from _shareHighlight.scss)
      if (node.tagName === 'share-highlight') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          '[--share-highlight-text-color:theme(colors.gray.900)]',
          '[--share-highlight-bg-color:theme(colors.gray.200)]',
          '[--share-highlight-text-color-active:theme(colors.white)]',
          '[--share-highlight-bg-color-active:theme(colors.blue.600)]',
          '[--share-highlight-tooltip-text-color:theme(colors.white)]',
          '[--share-highlight-tooltip-bg-color:theme(colors.gray.900)]'
        ])
      }

      // Add classes to tables
      if (node.tagName === 'table') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'w-full', 'border-collapse', 'border', 'border-gray-300',
          'dark:border-gray-600', 'my-6', 'rounded-lg', 'overflow-hidden'
        ])
      }

      if (node.tagName === 'th') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'bg-gray-100', 'dark:bg-gray-700', 'px-4', 'py-2', 'text-left',
          'font-semibold', 'border-b', 'border-gray-300', 'dark:border-gray-600'
        ])
      }

      if (node.tagName === 'td') {
        node.properties = node.properties || {}
        node.properties['className'] = (node.properties['className'] as string[] || []).concat([
          'px-4', 'py-2', 'border-b', 'border-gray-200', 'dark:border-gray-700'
        ])
      }
    })
  }
}

// Helper function to check if an element has a specific class
function hasClass(node: Element, className: string): boolean {
  const classes = node.properties?.['className'] as string[] | string | undefined
  if (Array.isArray(classes)) {
    return classes.includes(className)
  }
  if (typeof classes === 'string') {
    return classes.split(' ').includes(className)
  }
  return false
}

// Helper function to check if a code element is within a pre element
function isWithinPre(_node: Element): boolean {
  // This is a simplified check - in a real implementation you'd need to traverse up the tree
  // For now, we'll rely on the pre > code selector being handled separately
  return false
}

// Helper function to check if an element is within a code-tabs container
function isWithinCodeTabs(node: Element): boolean {
  // Check if the element has code-tabs related classes or data attributes
  const classes = node.properties?.['className'] as string[] | string | undefined
  if (Array.isArray(classes)) {
    return classes.some(cls => cls.includes('code-tab'))
  }
  if (typeof classes === 'string') {
    return classes.includes('code-tab')
  }
  // Could also check parent elements in a more complete implementation
  return false
}