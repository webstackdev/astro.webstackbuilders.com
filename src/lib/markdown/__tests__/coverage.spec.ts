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

import { markdownConfig } from '@lib/config/markdown'

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

/**
 * Build test cases for each plugin
 */
function buildPluginTestCases(pluginType: 'remark' | 'rehype') {
  const plugins = pluginType === 'remark' ? markdownConfig.remarkPlugins || [] : markdownConfig.rehypePlugins || []
  const testCases: Array<{ pluginName: string; pluginNameKebab: string; isLocal: boolean }> = []

  for (let index = 0; index < plugins.length; index++) {
    const pluginEntry = plugins[index] as any
    const plugin = Array.isArray(pluginEntry) ? pluginEntry[0] : pluginEntry
    const pluginName = (plugin as any).name || `plugin-${index}`
    const pluginNameKebab = toKebabCase(pluginName)
    const isLocal = LOCAL_PLUGINS.has(pluginName)

    testCases.push({ pluginName, pluginNameKebab, isLocal })
  }

  return testCases
}

describe('Markdown Plugin Test Coverage', () => {
  describe('remarkPlugins', () => {
    const remarkPlugins = buildPluginTestCases('remark')

    it.each(remarkPlugins)(
      'should have units_with_default_astro test for $pluginName',
      ({ pluginNameKebab }) => {
        expect(
          testFiles.unitsWithAstro.has(pluginNameKebab),
          `Missing test in units_with_default_astro/${pluginNameKebab}-astro.spec.ts`
        ).toBe(true)
      }
    )

    it.each(remarkPlugins)('should have e2e test for $pluginName', ({ pluginName }) => {
      expect(testFiles.e2e.has(pluginName), `Missing test in e2e/unifiedPlugins/${pluginName}.spec.tsx`).toBe(true)
    })

    it.each(remarkPlugins.filter(p => !p.isLocal))(
      'should have units test for $pluginName (external plugin)',
      ({ pluginNameKebab }) => {
        expect(testFiles.units.has(pluginNameKebab), `Missing test in units/${pluginNameKebab}.spec.ts`).toBe(true)
      }
    )
  })

  describe('rehypePlugins', () => {
    const rehypePlugins = buildPluginTestCases('rehype')

    it.each(rehypePlugins)(
      'should have units_with_default_astro test for $pluginName',
      ({ pluginNameKebab }) => {
        expect(
          testFiles.unitsWithAstro.has(pluginNameKebab),
          `Missing test in units_with_default_astro/${pluginNameKebab}-astro.spec.ts`
        ).toBe(true)
      }
    )

    it.each(rehypePlugins)('should have e2e test for $pluginName', ({ pluginName }) => {
      expect(testFiles.e2e.has(pluginName), `Missing test in e2e/unifiedPlugins/${pluginName}.spec.tsx`).toBe(true)
    })

    it.each(rehypePlugins.filter(p => !p.isLocal))(
      'should have units test for $pluginName (external plugin)',
      ({ pluginNameKebab }) => {
        expect(testFiles.units.has(pluginNameKebab), `Missing test in units/${pluginNameKebab}.spec.ts`).toBe(true)
      }
    )
  })
})
