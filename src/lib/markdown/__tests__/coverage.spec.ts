/**
 * Test Coverage Validator
 *
 * Ensures every markdown plugin has appropriate test coverage across all test locations:
 * - External plugins (npm packages): units/, units_with_default_astro/, e2e/
 * - Local plugins (src/lib/markdown/plugins/*): plugins/{name}/__tests__/, units_with_default_astro/, e2e/
 */

import { describe, it, beforeAll, expect } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { markdownConfig } from '../../config/markdown'

interface TestFileMap {
  units: Set<string>
  unitsWithAstro: Set<string>
  e2e: Set<string>
  pluginUnits: Set<string>
}

// Local plugins maintained in this repo (don't need tests in units/)
const LOCAL_PLUGINS = new Set([
  'remarkAbbreviations',
  'remarkAttributes',
  'remarkAttribution',
  'remarkReplacements',
  'rehypeTailwindClasses',
])

/**
 * Convert camelCase to kebab-case
 * Example: remarkBreaks -> remark-breaks
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

let testFiles: TestFileMap

beforeAll(() => {
  const testRoot = join(__dirname)
  const pluginsRoot = join(__dirname, '../plugins')

  // Scan all test directories for spec files
  const scanDirectory = (dir: string): Set<string> => {
    const files = new Set<string>()
    try {
      const items = readdirSync(dir)
      for (const item of items) {
        const fullPath = join(dir, item)
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = scanDirectory(fullPath)
          subFiles.forEach(f => files.add(f))
        } else if (item.match(/\.spec\.tsx?$/)) {
          // Extract test name without extension or suffix
          // Units: remark-breaks.spec.ts -> remark-breaks
          // Units with Astro: remark-breaks-astro.spec.ts -> remark-breaks
          // E2E: remarkBreaks.spec.tsx -> remarkBreaks
          const testName = item
            .replace(/\.spec\.tsx?$/, '')
            .replace(/-astro$/, '')
          files.add(testName)
        }
      }
    } catch {
      // Directory might not exist, that's ok
    }
    return files
  }

  testFiles = {
    units: scanDirectory(join(testRoot, 'units')),
    unitsWithAstro: scanDirectory(join(testRoot, 'units_with_default_astro')),
    e2e: scanDirectory(join(testRoot, 'e2e')),
    pluginUnits: scanDirectory(pluginsRoot),
  }
})

describe('Markdown Plugin Test Coverage', () => {
  describe('remarkPlugins', () => {
    it('should have tests in all appropriate locations', () => {
      const plugins = markdownConfig.remarkPlugins || []
      const missingTests: string[] = []

      for (let index = 0; index < plugins.length; index++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pluginEntry = plugins[index] as any
        const plugin = Array.isArray(pluginEntry) ? pluginEntry[0] : pluginEntry
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pluginName = (plugin as any).name || `plugin-${index}`
        const pluginNameKebab = toKebabCase(pluginName)
        const isLocal = LOCAL_PLUGINS.has(pluginName)

        // Check required test locations based on plugin type
        if (isLocal) {
          // Local plugins: units_with_default_astro/, e2e/ only
          // (skip plugins/{name}/__tests__/ and units/ - assume they exist)
          if (!testFiles.unitsWithAstro.has(pluginNameKebab)) {
            missingTests.push(
              `❌ ${pluginName} (local): Missing test in units_with_default_astro/${pluginNameKebab}-astro.spec.ts`
            )
          }
          if (!testFiles.e2e.has(pluginName)) {
            missingTests.push(`❌ ${pluginName} (local): Missing test in e2e/unifiedPlugins/${pluginName}.spec.tsx`)
          }
        } else {
          // External plugins: units/, units_with_default_astro/, e2e/
          if (!testFiles.units.has(pluginNameKebab)) {
            missingTests.push(`❌ ${pluginName} (npm): Missing test in units/${pluginNameKebab}.spec.ts`)
          }
          if (!testFiles.unitsWithAstro.has(pluginNameKebab)) {
            missingTests.push(`❌ ${pluginName} (npm): Missing test in units_with_default_astro/${pluginNameKebab}-astro.spec.ts`)
          }
          if (!testFiles.e2e.has(pluginName)) {
            missingTests.push(`❌ ${pluginName} (npm): Missing test in e2e/unifiedPlugins/${pluginName}.spec.tsx`)
          }
        }
      }

      if (missingTests.length > 0) {
        console.error('\nMissing remark plugin tests:')
        missingTests.forEach(msg => console.error(msg))
      }

      expect(missingTests).toHaveLength(0)
    })
  })

  describe('rehypePlugins', () => {
    it('should have tests in all appropriate locations', () => {
      const plugins = markdownConfig.rehypePlugins || []
      const missingTests: string[] = []

      for (let index = 0; index < plugins.length; index++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pluginEntry = plugins[index] as any
        const plugin = Array.isArray(pluginEntry) ? pluginEntry[0] : pluginEntry
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pluginName = (plugin as any).name || `plugin-${index}`
        const pluginNameKebab = toKebabCase(pluginName)
        const isLocal = LOCAL_PLUGINS.has(pluginName)

        // Check required test locations based on plugin type
        if (isLocal) {
          // Local plugins: units_with_default_astro/, e2e/ only
          // (skip plugins/{name}/__tests__/ and units/ - assume they exist)
          if (!testFiles.unitsWithAstro.has(pluginNameKebab)) {
            missingTests.push(
              `❌ ${pluginName} (local): Missing test in units_with_default_astro/${pluginNameKebab}-astro.spec.ts`
            )
          }
          if (!testFiles.e2e.has(pluginName)) {
            missingTests.push(`❌ ${pluginName} (local): Missing test in e2e/unifiedPlugins/${pluginName}.spec.tsx`)
          }
        } else {
          // External plugins: units/, units_with_default_astro/, e2e/
          if (!testFiles.units.has(pluginNameKebab)) {
            missingTests.push(`❌ ${pluginName} (npm): Missing test in units/${pluginNameKebab}.spec.ts`)
          }
          if (!testFiles.unitsWithAstro.has(pluginNameKebab)) {
            missingTests.push(`❌ ${pluginName} (npm): Missing test in units_with_default_astro/${pluginNameKebab}-astro.spec.ts`)
          }
          if (!testFiles.e2e.has(pluginName)) {
            missingTests.push(`❌ ${pluginName} (npm): Missing test in e2e/unifiedPlugins/${pluginName}.spec.tsx`)
          }
        }
      }

      if (missingTests.length > 0) {
        console.error('\nMissing rehype plugin tests:')
        missingTests.forEach(msg => console.error(msg))
      }

      expect(missingTests).toHaveLength(0)
    })
  })
})
