/**
 * Layer 4: E2E Tests - Plugin Coverage
 *
 * Ensures that every plugin in the markdown configuration has a corresponding test file.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { markdownConfig } from '../../../config/markdown'

let testFiles: string[]

// Collect all test files once before running tests
beforeAll(() => {
  const unifiedPluginsDir = join(__dirname, 'unifiedPlugins')
  const currentDir = __dirname

  // Get test files from both directories
  const unifiedFiles = readdirSync(unifiedPluginsDir)
    .filter(file => file.endsWith('.spec.ts') || file.endsWith('.spec.tsx'))
  const currentDirFiles = readdirSync(currentDir)
    .filter(file => file.endsWith('.spec.ts') || file.endsWith('.spec.tsx'))

  testFiles = [...unifiedFiles, ...currentDirFiles]
})

describe('Layer 4: Plugin Coverage', () => {
  describe('Remark Plugins', () => {
    const remarkPlugins = markdownConfig.remarkPlugins || []

    remarkPlugins.forEach((entry, index) => {
      const plugin = Array.isArray(entry) ? entry[0] : entry
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pluginName = (plugin as any).name || `plugin-${index}`

      it(`should have a test file for ${pluginName}`, () => {
        // Look for test file matching the plugin name
        const expectedFilename = `${pluginName}.spec.ts`
        const expectedFilenameX = `${pluginName}.spec.tsx`

        const hasTestFile = testFiles.some(
          file => file === expectedFilename || file === expectedFilenameX
        )

        expect(hasTestFile).toBe(true)
        if (!hasTestFile) {
          console.error(`Missing test file: ${expectedFilename} or ${expectedFilenameX}`)
        }
      })
    })
  })

  describe('Rehype Plugins', () => {
    const rehypePlugins = markdownConfig.rehypePlugins || []

    rehypePlugins.forEach((entry, index) => {
      const plugin = Array.isArray(entry) ? entry[0] : entry
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pluginName = (plugin as any).name || `plugin-${index}`

      it(`should have a test file for ${pluginName}`, () => {
        // Look for test file matching the plugin name
        const expectedFilename = `${pluginName}.spec.ts`
        const expectedFilenameX = `${pluginName}.spec.tsx`

        const hasTestFile = testFiles.some(
          file => file === expectedFilename || file === expectedFilenameX
        )

        expect(hasTestFile).toBe(true)
        if (!hasTestFile) {
          console.error(`Missing test file: ${expectedFilename} or ${expectedFilenameX}`)
        }
      })
    })
  })
})
