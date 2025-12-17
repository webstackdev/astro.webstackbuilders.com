/**
 * Remark plugin for typographic replacements
 *
 * Performs safe text replacements for:
 * - Smart arrows (-->, <--, <-->, ==>, <==, <==>)
 * - Plus-minus (+-) → ±
 * - Common fractions (1/2, 1/4, 3/4) → ½, ¼, ¾
 * - Multiplication sign (2 x 4) → 2 × 4
 *
 * Only transforms text nodes, preserving code blocks, inline code, and HTML.
 * Complements Astro's built-in smartypants (quotes, dashes, ellipsis).
 */
import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

/**
 * Replacement rule definition
 */
export interface ReplacementRule {
  /** Unique name for the rule (for selective disabling) */
  name: string
  /** Regular expression to match */
  re: RegExp
  /** Replacement string or function */
  sub: string | ((_match: string, ..._args: string[]) => string)
}

/**
 * Plugin options
 */
export interface RemarkReplacementsOptions {
  /** Custom replacement rules (overrides defaults if provided) */
  map?: ReplacementRule[]
  /** Names of rules to disable */
  disable?: string[]
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Default replacement rules
 * Order matters: process longer patterns first to avoid premature matches
 */
export const defaultReplacements: ReplacementRule[] = [
  // Double arrows (process before single arrows to avoid premature match)
  { name: 'arrow_double_lr', re: /<==>/g, sub: '⇔' },
  { name: 'arrow_double_right', re: /==>/g, sub: '⇒' },
  { name: 'arrow_double_left', re: /<==(?!=)/g, sub: '⇐' },

  // Single arrows
  // Note: `remark-smartypants` can convert `--` into an em dash (`—`) before this
  // plugin runs, so we support both ASCII and smartypants-transformed forms.
  { name: 'arrow_lr', re: /<(?:--|—)>/g, sub: '↔' },
  { name: 'arrow_right', re: /(?:--|—)>/g, sub: '→' },
  { name: 'arrow_left', re: /<(?:(?:--)(?!-)|(?:—)(?!—))/g, sub: '←' },

  // Plus-minus
  { name: 'plusminus', re: /\+-/g, sub: '±' },

  // Common fractions (use word boundaries to avoid matching in code)
  { name: 'onehalf', re: /\b1\/2\b/g, sub: '½' },
  { name: 'onequarter', re: /\b1\/4\b/g, sub: '¼' },
  { name: 'threequarters', re: /\b3\/4\b/g, sub: '¾' },

  // Multiplication sign (number x number pattern only)
  {
    name: 'multiplication',
    re: /\b(\d+)\s*x\s*(\d+)\b/gi,
    sub: (_match: string, a: string, b: string) => `${a} × ${b}`,
  },
]

/**
 * Remark plugin to apply typographic replacements to text nodes
 *
 * @param options - Plugin configuration options
 * @returns Unified transformer function
 *
 * @example
 * ```ts
 * import remarkReplacements from './remark-replacements'
 *
 * export default {
 *   markdown: {
 *     remarkPlugins: [
 *       [remarkReplacements, { disable: ['multiplication'] }]
 *     ]
 *   }
 * }
 * ```
 */
const remarkReplacements: Plugin<[RemarkReplacementsOptions?], Root> = (options = {}) => {
  const { map = defaultReplacements, disable = [], debug = false } = options

  // Filter out disabled rules
  const activeRules = map.filter(rule => !disable.includes(rule.name))

  if (debug) {
    console.log('[remark-replacements] Active rules:', activeRules.map(r => r.name))
  }

  return tree => {
    let replacementCount = 0

    visit(tree, 'text', node => {
      const original = node.value
      let modified = original

      // Apply each replacement rule in order
      for (const rule of activeRules) {
        if (typeof rule.sub === 'function') {
          modified = modified.replace(rule.re, rule.sub)
        } else {
          modified = modified.replace(rule.re, rule.sub)
        }
      }

      // Only update if changed
      if (modified !== original) {
        node.value = modified
        replacementCount++

        if (debug) {
          console.log(`[remark-replacements] Replaced: "${original}" → "${modified}"`)
        }
      }
    })

    if (debug) {
      console.log(`[remark-replacements] Total text nodes modified: ${replacementCount}`)
    }
  }
}

export default remarkReplacements
