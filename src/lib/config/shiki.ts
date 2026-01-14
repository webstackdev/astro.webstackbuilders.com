import type { ShikiTransformer } from '@shikijs/types'
import type { Element } from 'hast'
import { createCssVariablesTheme } from 'shiki/core'
import {
  parseMetaHighlightString,
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationErrorLevel,
} from '@shikijs/transformers'

const insMetaRegex = /(?:^|\s)ins=\{([^}]+)\}/
const delMetaRegex = /(?:^|\s)del=\{([^}]+)\}/
const errorMetaRegex = /(?:^|\s)error=\{([^}]+)\}/
const warningMetaRegex = /(?:^|\s)warning=\{([^}]+)\}/

function parseLineSet(metaRaw: string | undefined, regex: RegExp): Set<number> {
  const lines = new Set<number>()
  if (!metaRaw) return lines

  const match = regex.exec(metaRaw)
  const spec = match?.[1] ? `{${match[1]}}` : null
  const parsed = spec ? parseMetaHighlightString(spec) : null

  for (const line of parsed ?? []) lines.add(line)

  return lines
}

function parseDiffMeta(metaRaw: string | undefined): { ins: Set<number>; del: Set<number> } {
  return {
    ins: parseLineSet(metaRaw, insMetaRegex),
    del: parseLineSet(metaRaw, delMetaRegex),
  }
}

function parseErrorWarningMeta(metaRaw: string | undefined): { error: Set<number>; warning: Set<number> } {
  return {
    error: parseLineSet(metaRaw, errorMetaRegex),
    warning: parseLineSet(metaRaw, warningMetaRegex),
  }
}

function transformerMetaDiffInsDel(): ShikiTransformer {
  return {
    name: 'transformer-meta-diff-ins-del',
    line(this, lineNode, lineNumber) {
      const raw = this.options.meta?.__raw
      if (typeof raw !== 'string' || !raw.trim()) return

      const parsed = parseDiffMeta(raw)

      const isIns = parsed.ins.has(lineNumber)
      const isDel = parsed.del.has(lineNumber)
      if (!isIns && !isDel) return

      const stripInlineStyles = (node: Element): void => {
        if (node.properties) {
          delete (node.properties as Record<string, unknown>)['style']
        }

        for (const child of node.children) {
          if (child.type === 'element') stripInlineStyles(child as Element)
        }
      }

      if (isIns) this.addClassToHast(lineNode, 'diff-ins')
      if (isDel) this.addClassToHast(lineNode, 'diff-del')

      // Remove Shiki's inline token styles so the diff line color can be inherited.
      stripInlineStyles(lineNode)

      return lineNode
    },
  }
}

function transformerMetaErrorWarning(): ShikiTransformer {
  return {
    name: 'transformer-meta-error-warning',
    line(this, lineNode, lineNumber) {
      const raw = this.options.meta?.__raw
      if (typeof raw !== 'string' || !raw.trim()) return

      const parsed = parseErrorWarningMeta(raw)

      const isError = parsed.error.has(lineNumber)
      const isWarning = parsed.warning.has(lineNumber)
      if (!isError && !isWarning) return

      if (isError) this.addClassToHast(lineNode, 'line-error')
      if (isWarning) this.addClassToHast(lineNode, 'line-warning')

      return lineNode
    },
  }
}

export const shikiTransformers: ShikiTransformer[] = [
  transformerMetaHighlight({ className: 'highlighted' }),
  transformerMetaWordHighlight({ className: 'highlighted-word' }),
  transformerNotationErrorLevel({
    classMap: {
      error: 'line-error',
      warning: 'line-warning',
    },
  }),
  transformerMetaDiffInsDel(),
  transformerMetaErrorWarning(),
]

export const shikiConfigOptions = {
  theme: 'css-variables',
  themeRegistrations: [
    createCssVariablesTheme({
      name: 'css-variables',
      variablePrefix: '--shiki-',
      fontStyle: true,
    }),
  ],
  langAlias: {
    js: 'javascript',
    ts: 'typescript',
    md: 'markdown',
  },
  wrap: true,
} as const
