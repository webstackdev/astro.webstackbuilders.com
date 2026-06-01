import { readdirSync } from 'node:fs'
import { relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const deepDiveContentRoot = fileURLToPath(new URL('../../content/articles', import.meta.url))

export interface DeepDiveAliasOptions {
  contentRoot?: string
}

export function getDeepDiveArticleAliasPaths(
  options: DeepDiveAliasOptions = {}
): string[] {
  const contentRoot = options.contentRoot ?? deepDiveContentRoot
  const pdfEntries = collectDeepDiveEntries(contentRoot)

  return pdfEntries
    .map(entryPath => `/articles/${normalizeDeepDiveEntryId(entryPath)}`)
    .sort((left, right) => left.localeCompare(right))
}

export function normalizeDeepDiveEntryId(entryPath: string): string {
  const normalizedEntry = entryPath.replace(/\\/g, '/')
  const withoutExtension = normalizedEntry.replace(/\.[^/.]+$/, '')

  return withoutExtension.endsWith('/pdf')
    ? withoutExtension.slice(0, -'/pdf'.length)
    : withoutExtension
}

function collectDeepDiveEntries(contentRoot: string, currentDir = contentRoot): string[] {
  const entries = readdirSync(currentDir, { withFileTypes: true })
  const deepDiveEntries: string[] = []

  for (const entry of entries) {
    const entryPath = join(currentDir, entry.name)

    if (entry.isDirectory()) {
      deepDiveEntries.push(...collectDeepDiveEntries(contentRoot, entryPath))
      continue
    }

    if (entry.isFile() && entry.name === 'pdf.mdx') {
      deepDiveEntries.push(relative(contentRoot, entryPath))
    }
  }

  return deepDiveEntries
}