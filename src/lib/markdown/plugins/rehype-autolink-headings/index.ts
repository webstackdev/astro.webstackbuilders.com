/**
 * Rehype plugin that appends anchor links to headings with `id` attributes.
 *
 * This is a project-owned fork of `rehype-autolink-headings` with all
 * configuration hard-coded for our site. There are no user-facing options.
 *
 * Behavior: append an `<a>` after the heading text containing a link-icon
 * `<span>`. Classes on the `<a>` and `<span>` support the project's
 * heading-anchor hover/focus styles.
 */
import { headingRank } from 'hast-util-heading-rank'
import { SKIP, visit } from 'unist-util-visit'
import type { ElementContent, Element, Root } from 'hast'

/**
 * Properties set on the injected `<a>` element.
 * These classes let us style heading anchors independently from the generic
 * `<a>` handling in rehypeTailwindClasses.
 */
const linkProperties = {
  className: [
    'heading-anchor',
    'no-underline',
    'hover:no-underline',
    'focus-visible:no-underline',
    'transition-colors',
  ],
  ariaLabel: 'Link to this section',
}

/** The `<span>` content inserted inside each heading anchor link. */
const anchorContent: Element = {
  type: 'element',
  tagName: 'span',
  properties: {
    className: ['anchor-link', 'text-base', 'sm:text-lg'],
    ariaHidden: 'true',
  },
  children: [{ type: 'text', value: '🔗' }],
}

/**
 * Create an `<a>` element linking back to the heading.
 */
function createLink(node: Readonly<Element>, children: ElementContent[]): Element {
  return {
    type: 'element',
    tagName: 'a',
    properties: { ...structuredClone(linkProperties), href: `#${node.properties['id']}` },
    children,
  }
}

/**
 * Rehype plugin — adds self-linking anchors to headings that have an `id`.
 * All configuration is hard-coded; the plugin accepts no options.
 */
export function rehypeAutolinkHeadings() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (!headingRank(node) || !node.properties['id']) return

      const children: ElementContent[] = [structuredClone(anchorContent)]
      node.children.push(createLink(node, children))

      return SKIP
    })
  }
}

export default rehypeAutolinkHeadings
