/**
 * Rehype plugin to automatically add Tailwind classes to markdown-generated HTML elements
 */
import { visit, SKIP } from 'unist-util-visit'
import type { Root, Element, Parent } from 'hast'
import { applyHtmlElementClasses, getElementConfig } from './visitors/simple.js'
import { hasClass, isCodeInline } from './utils.js'

function isHastElement(node: Parent | undefined): node is Element {
  return Boolean(node && (node as Element).type === 'element')
}

/**
 * Rehype plugin that adds Tailwind CSS classes to HTML elements
 * @returns Transformer function for rehype
 */
export function rehypeTailwindClasses() {
  return (tree: Root) => {
    const parentByNode = new WeakMap<Element, Parent>()

    const getParent = (node: Element): Parent | undefined => parentByNode.get(node)

    const hasAttributionFigcaption = (figure: Element): boolean => {
      return figure.children.some(child => {
        return (
          isHastElement(child as Parent | undefined) &&
          (child as Element).tagName === 'figcaption' &&
          hasClass(child as Element, 'blockquote-attribution')
        )
      })
    }

    const hasInlineAttribution = (blockquote: Element): boolean => {
      return blockquote.children.some(child => {
        return (
          isHastElement(child as Parent | undefined) &&
          hasClass(child as Element, 'blockquote-attribution')
        )
      })
    }

    const isInsideBlockquoteAttribution = (node: Element): boolean => {
      let currentParent = getParent(node)

      while (isHastElement(currentParent)) {
        if (hasClass(currentParent, 'blockquote-attribution')) return true
        currentParent = getParent(currentParent)
      }

      return false
    }

    const isInsideCodeBlockOrTabs = (node: Element): boolean => {
      let currentParent = getParent(node)

      while (isHastElement(currentParent)) {
        if (['pre', 'code', 'code-tabs'].includes(currentParent.tagName)) return true
        currentParent = getParent(currentParent as Element)
      }

      return false
    }

    const hasListAncestor = (node: Element): boolean => {
      let currentParent = getParent(node)

      while (isHastElement(currentParent)) {
        if (currentParent.tagName === 'ul' || currentParent.tagName === 'ol') return true
        currentParent = getParent(currentParent as Element)
      }

      return false
    }

    visit(tree, 'element', (node: Element, index, parent): void | typeof SKIP => {
      if (parent) {
        parentByNode.set(node, parent)
      }

      /**
       * =============================================================================
       *
       * Markdown list container
       *
       * Wrap top-level markdown lists in a container we can style without affecting
       * component-internal lists (e.g. <code-tabs> uses <ul> for tab headers).
       *
       * =============================================================================
       */
      if ((node.tagName === 'ul' || node.tagName === 'ol') && typeof index === 'number') {
        const isInsideCode = isInsideCodeBlockOrTabs(node)
        const isNestedList = hasListAncestor(node)

        if (!isInsideCode && !isNestedList && parent && Array.isArray(parent.children)) {
          const wrapper: Element = {
            type: 'element',
            tagName: 'div',
            properties: {
              className: [
                'markdown-list',
                'mb-6',
              ],
            },
            children: [node],
          }

          parent.children.splice(index, 1, wrapper)
          parentByNode.set(wrapper, parent)
          parentByNode.set(node, wrapper)
        }
      }

      /** Check if this is a simple HTML element from our configuration */
      const elementConfig = getElementConfig(node.tagName)
      if (elementConfig) {
        applyHtmlElementClasses(node, elementConfig)

        // Some elements (like <figure>/<figcaption>) need additional conditional styling.
        if (!['figure', 'figcaption'].includes(node.tagName)) return
      }

      /**
       * =============================================================================
       *
       * Figure / Figcaption stylings
       *
       * =============================================================================
       */
      if (node.tagName === 'figure' && !hasClass(node, 'blockquote')) {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'my-8',
          'mx-auto',
          'max-w-none',
        ])
      }

      // For captions added by the remark-captions plugin (and other non-blockquote figcaptions).
      if (
        node.tagName === 'figcaption' &&
        !hasClass(node, 'blockquote-attribution') &&
        !hasClass(node, 'blockquote-caption')
      ) {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'italic',
          'mt-[-0.25rem]',
          'text-base',
          'text-center',
        ])
      }

      /**
       * =============================================================================
       *
       * Paragraph stylings
       *
       * =============================================================================
       */
      if (node.tagName === 'p' && !isInsideBlockquoteAttribution(node)) {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'mb-6',
          'leading-relaxed',
        ])
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
          'relative',
          'my-6',
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
          'bg-page-base-offset',
          'inline-block',
          'font-mono',
          'mx-1',
          'px-2',
          'pb-1',
        ])
      }

      /**
       * Non-Code Tabs Text Code blocks (pre > code.language-text) should wrap text
       * instead of forcing horizontal scrolling. This keeps the existing <pre>
       * styles but allows future styling specifically for text blocks.
       */
      if (node.tagName === 'code' && hasClass(node, 'language-text')) {
        const parent = getParent(node)

        if (isHastElement(parent) && parent.tagName === 'pre') {
          node.properties = node.properties || {}
          parent.properties = parent.properties || {}

          /** Styles for the <pre> element within a text code block */
          parent.properties['className'] = ((parent.properties['className'] as string[]) || []).concat([
            'bg-[var(--shiki-background)]',
            'block',
            'max-w-full',
            'overflow-x-hidden',
            'pr-3',
            'py-3',
          ])

          /** Styles for the <code> element within a text code block */
          node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
            'break-words',
            'my-2',
            'whitespace-pre-wrap',
            'text-[var(--shiki-foreground)]',
          ])
        }
      }

      /**
       * Code Tabs container stylings
       */
      if (node.tagName === 'code-tabs') {
        node.properties = node.properties || {}

        /** Outer code-tabs custom web component container */
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'block',
          'border-page-base-offset',
          'border',
          'max-w-full',
          'mb-4',
          'min-w-0',
          'overflow-hidden',
          'rounded-md',
          'w-full',
        ])

        visit(node, 'element', (child: Element, _childIndex, childParent) => {
          if (child.tagName === 'pre') {
            child.properties = child.properties || {}

            /** Styles for the <pre> element within a code-tabs block */
            child.properties['className'] = ((child.properties['className'] as string[]) || []).concat([
              'bg-[var(--shiki-background)]',
              'block',
              'max-w-full',
              'pr-3',
              'py-3',
            ])
          }

          if (
            child.tagName === 'code' &&
            isHastElement(childParent) &&
            childParent.tagName === 'pre' &&
            !hasClass(child, 'language-text')
          ) {
            child.properties = child.properties || {}

            /** Styles for the <code> element within a code-tabs block */
            child.properties['className'] = ((child.properties['className'] as string[]) || []).concat([
              'text-[var(--shiki-foreground)]',
            ])
          }
        })
      }

      /**
       * Generic code blocks with no language tag (pre > code) stylings
       */
      if (node.tagName === 'pre') {
        const parent = getParent(node)

        // Code tabs manage their own <pre>/<code> styling.
        if (isHastElement(parent) && parent.tagName === 'code-tabs') return

        // Text code blocks (pre > code.language-text) are handled in the language-text branch.
        const hasTextChild = node.children?.some(child => {
          return (
            isHastElement(child as Parent | undefined) &&
            (child as Element).tagName === 'code' &&
            hasClass(child as Element, 'language-text')
          )
        })
        if (hasTextChild) return

        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'block',
          'bg-page-base-offset',
          'max-w-full',
          'pr-3',
          'py-3',
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
        const existingClasses = (node.properties['className'] as string[]) || []

        const parent = getParent(node)
        const isWrappedFigure = isHastElement(parent) && parent.tagName === 'figure' && hasClass(parent, 'blockquote')
        const isCaptionFigure = isHastElement(parent) && parent.tagName === 'figure' && hasClass(parent, 'blockquote-figure')
        const isAttributionFigure = isWrappedFigure && !isCaptionFigure && isHastElement(parent) && hasAttributionFigcaption(parent)
        const hasInlineAttributionInCaptionedBlockquote = isCaptionFigure && hasInlineAttribution(node)

        // Default: plain blockquote (not wrapped by remark-blockquote)
        // Center the blockquote box and center its content.
        const defaultClasses = [
          'my-8',
          'mx-auto',
          'max-w-4xl',
          'border-2',
          'border-dashed',
          'border-primary/20',
          'rounded-md',
          'p-8',
          'text-center',
          'text-xl',
          'text-content',
          'font-serif',
          'italic',
          'leading-relaxed',
        ]

        // Wrapped: attribution-only figure layout (side-by-side)
        const attributionOnlyClasses = [
          'flex-1',
          'text-center',
          'text-xl',
          'text-content',
          'font-serif',
          'italic',
          'leading-relaxed',
        ]

        // Wrapped: caption figure layout (border on the blockquote so caption sits outside)
        const captionedClasses = [
          'border-2',
          'border-dashed',
          'border-primary/20',
          'rounded-md',
          'p-8',
          'text-center',
          'text-xl',
          'text-content',
          'font-serif',
          'italic',
          'leading-relaxed',
          // If we also have an inline attribution element, use the same side-by-side layout
          // as attribution-only blockquotes, but inside the bordered blockquote.
          ...(hasInlineAttributionInCaptionedBlockquote ? ['md:flex', 'md:items-center', 'md:gap-8'] : []),
        ]

        const classesToAdd = isAttributionFigure
          ? attributionOnlyClasses
          : isCaptionFigure
            ? captionedClasses
            : defaultClasses

        node.properties['className'] = existingClasses.concat(classesToAdd)
      }

      /** remark-blockquote: Attribution-only figure layout */
      if (
        node.tagName === 'figure' &&
        hasClass(node, 'blockquote') &&
        !hasClass(node, 'blockquote-figure') &&
        hasAttributionFigcaption(node)
      ) {
        node.properties = node.properties || {}

        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'mx-auto',
          'my-8',
          'max-w-4xl',
          'md:flex',
          'md:items-center',
          'md:gap-8',
          'border-2',
          'border-dashed',
          'border-primary/20',
          'rounded-md',
          'p-8',
        ])
      }

      /** remark-blockquote: Captioned figure layout (no border on figure) */
      if (node.tagName === 'figure' && hasClass(node, 'blockquote-figure')) {
        node.properties = node.properties || {}

        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'mx-auto',
          'my-8',
          'max-w-4xl',
        ])
      }

      /** remark-blockquote: Attribution styling (figcaption variant) */
      if (node.tagName === 'figcaption' && hasClass(node, 'blockquote-attribution')) {
        node.properties = node.properties || {}

        const existing = (node.properties['className'] as string[]) || []

        node.properties['className'] = existing.concat([
          'mt-4',
          'md:mt-0',
          'md:w-auto',
          'shrink-0',
          'flex',
          'items-center',
          'gap-3',
          'text-sm',
          'border-t',
          'md:border-t-0',
          'md:border-l',
          'border-trim',
          'pt-4',
          'md:pt-0',
          'md:pl-8',
          'not-italic',
        ])

        // Style the generated <p> lines inside the attribution container.
        let attributionLineIndex = 0
        visit(node, 'element', (child: Element) => {
          if (child.tagName !== 'p') return

          child.properties = child.properties || {}
          const childClasses = (child.properties['className'] as string[]) || []

          attributionLineIndex += 1
          child.properties['className'] = childClasses.concat(
            attributionLineIndex === 1 ? ['font-bold', 'text-content'] : ['text-xs', 'text-content-offset']
          )
        })
      }

      /** remark-blockquote: Attribution styling (div variant for caption+attribution) */
      if (node.tagName === 'div' && hasClass(node, 'blockquote-attribution')) {
        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'mt-4',
          'md:mt-0',
          'md:w-auto',
          'shrink-0',
          'flex',
          'items-center',
          'gap-3',
          'text-sm',
          'border-t',
          'md:border-t-0',
          'md:border-l',
          'border-trim',
          'pt-4',
          'md:pt-0',
          'md:pl-8',
          'not-italic',
          // Override quote typography inherited from the blockquote.
          'font-sans',
          'text-left',
        ])

        let attributionLineIndex = 0
        visit(node, 'element', (child: Element) => {
          if (child.tagName !== 'p') return

          child.properties = child.properties || {}
          const childClasses = (child.properties['className'] as string[]) || []

          attributionLineIndex += 1
          child.properties['className'] = childClasses.concat(
            attributionLineIndex === 1 ? ['font-bold', 'text-content'] : ['text-xs', 'text-content-offset']
          )
        })
      }

      /** remark-blockquote: Caption + attribution layout tweaks */
      if (node.tagName === 'p') {
        const parent = getParent(node)
        if (!isHastElement(parent) || parent.tagName !== 'blockquote') return

        const figure = getParent(parent as Element)
        const isCaptionFigure = isHastElement(figure) && figure.tagName === 'figure' && hasClass(figure, 'blockquote-figure')
        if (!isCaptionFigure) return

        if (!hasInlineAttribution(parent as Element)) return

        node.properties = node.properties || {}
        node.properties['className'] = ((node.properties['className'] as string[]) || []).concat([
          'md:flex-1',
          'md:mb-0',
        ])
      }

      /** remark-blockquote: Caption styling */
      if (node.tagName === 'figcaption' && hasClass(node, 'blockquote-caption')) {
        node.properties = node.properties || {}

        const existing = (node.properties['className'] as string[]) || []

        node.properties['className'] = existing.concat([
          'mt-4',
          'text-center',
          'text-base',
          'text-content-offset',
          'italic',
        ])
      }
    })
  }
}
