/**
 * Rehype plugin that appends anchor links to headings with `id` attributes.
 *
 * This is a project-owned fork of `rehype-autolink-headings` with all
 * configuration hard-coded for our site. There are no user-facing options.
 *
 * Behavior: append an `<a>` after the heading text containing a link SVG icon
 * wrapped in a `<span>`. The markup and classes exactly mirror the Astro
 * `HeadingAnchor` component so both sources produce identical output.
 */
import { headingRank } from 'hast-util-heading-rank'
import { SKIP, visit } from 'unist-util-visit'
import type { ElementContent, Element, Root } from 'hast'

/**
 * Properties set on the injected `<a>` element.
 * Mirrors: `<a class="group transition-colors no-underline …" …>` in HeadingAnchor.
 */
const linkProperties = {
  className: [
    'group',
    'inline-flex',
    'min-h-6',
    'min-w-6',
    'items-center',
    'justify-center',
    'align-middle',
    'transition-colors',
    'no-underline',
    'hover:no-underline',
    'focus-visible:no-underline',
    'ml-1.5',
  ],
  ariaLabel: 'Link to this section',
  tabIndex: -1,
}

/**
 * The inline SVG for the link icon (from src/components/Icon/icons/link.astro).
 * Rendered with size=6 and color=page-inverse.
 */
const linkSvg: Element = {
  type: 'element',
  tagName: 'svg',
  properties: {
    xmlns: 'http://www.w3.org/2000/svg',
    className: ['shrink-0', 'w-6', 'h-6', 'text-page-inverse'],
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    ariaHidden: 'true',
    focusable: 'false',
  },
  children: [
    {
      type: 'element',
      tagName: 'path',
      properties: {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: '2',
        d: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      },
      children: [],
    },
  ],
}

/**
 * The `<span>` wrapper for the icon, with hover/focus opacity classes.
 * Mirrors the `<span>` in HeadingAnchor/index.astro.
 */
const anchorContent: Element = {
  type: 'element',
  tagName: 'span',
  properties: {
    className: [
      'inline-block',
      'ml-[0.2rem]',
      'opacity-0',
      '-translate-x-1',
      'transition-opacity',
      'duration-200',
      'ease-in-out',
      '[h1:hover_&]:opacity-100',
      '[h2:hover_&]:opacity-100',
      '[h3:hover_&]:opacity-100',
      '[h4:hover_&]:opacity-100',
      '[h5:hover_&]:opacity-100',
      '[h6:hover_&]:opacity-100',
      'group-focus-visible:opacity-100',
    ],
    ariaHidden: 'true',
  },
  children: [linkSvg],
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
