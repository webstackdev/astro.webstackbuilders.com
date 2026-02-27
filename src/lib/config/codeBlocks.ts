/**
 * Centralized configuration for how code block language names are displayed.
 *
 * The `languageDisplayNames` map controls the label shown in code block headers.
 * Keys are language identifiers as written in Markdown code fences (lowercase).
 * Values are the display strings shown in the UI.
 *
 * Languages not listed here fall back to capitalizing the first letter
 * (e.g. "python" → "Python", "ruby" → "Ruby").
 *
 * When a code fence uses a Shiki language alias (e.g. `ts` → `typescript`),
 * the display label is resolved from the **original** identifier the author
 * wrote, not the resolved Shiki language. This allows `promql` (aliased to
 * `go` for highlighting) to display as "PromQL" while real `go` fences
 * display as "Go".
 */
export const languageDisplayNames: Record<string, string> = {
  // All-uppercase acronym languages
  css: 'CSS',
  hcl: 'HCL',
  html: 'HTML',
  http: 'HTTP',
  json: 'JSON',
  sql: 'SQL',
  toml: 'TOML',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',

  // Mixed-case languages
  graphql: 'GraphQL',
  javascript: 'JavaScript',
  js: 'JavaScript',
  jsx: 'JSX',
  markdown: 'Markdown',
  md: 'Markdown',
  promql: 'PromQL',
  ts: 'TypeScript',
  tsx: 'TSX',
  typescript: 'TypeScript',
}

/**
 * Returns the display label for a code block language.
 *
 * Should be called with the **original** language identifier from the Markdown
 * source (before Shiki alias resolution) so that aliases like `promql` display
 * correctly instead of showing the resolved target (`go`).
 *
 * Lookup order:
 * 1. Exact match in `languageDisplayNames`
 * 2. Capitalize first letter (default)
 */
export function formatLanguageLabel(language: string): string {
  const key = language.trim().toLowerCase()
  if (!key) return language

  const explicit = languageDisplayNames[key]
  if (explicit) return explicit

  // Default: capitalize first letter
  return key.charAt(0).toUpperCase() + key.slice(1)
}
