import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getDeepDiveArticleAliasPaths,
  normalizeDeepDiveEntryId,
} from '../deepDiveAliases'

describe('deepDiveAliases', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes deep-dive pdf entries to route ids', () => {
    expect(normalizeDeepDiveEntryId('platform-architecture/pdf.mdx')).toBe('platform-architecture')
    expect(normalizeDeepDiveEntryId('nested/guide/pdf.mdx')).toBe('nested/guide')
    expect(normalizeDeepDiveEntryId('nested\\guide\\pdf.mdx')).toBe('nested/guide')
  })

  it('returns article alias paths for deep-dive pdf files', () => {
    const contentRoot = mkdtempSync(join(tmpdir(), 'deep-dive-aliases-'))

    mkdirSync(join(contentRoot, 'first-article'), { recursive: true })
    mkdirSync(join(contentRoot, 'nested', 'second-article'), { recursive: true })
    mkdirSync(join(contentRoot, 'ignored'), { recursive: true })

    writeFileSync(join(contentRoot, 'first-article', 'pdf.mdx'), '---\ntitle: First\n---')
    writeFileSync(join(contentRoot, 'nested', 'second-article', 'pdf.mdx'), '---\ntitle: Second\n---')
    writeFileSync(join(contentRoot, 'ignored', 'index.mdx'), '---\ntitle: Ignored\n---')

    expect(getDeepDiveArticleAliasPaths({ contentRoot })).toEqual([
      '/articles/first-article',
      '/articles/nested/second-article',
    ])
  })
})