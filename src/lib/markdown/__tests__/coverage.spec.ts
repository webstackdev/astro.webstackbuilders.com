/**
 * Test Coverage Validator
 *
 * Ensures every markdown plugin has appropriate test coverage across all test locations:
 * - External plugins (npm packages): units/, integration/, e2e/
 * - Local plugins (src/lib/markdown/plugins/*): plugins/{name}/__tests__/, integration/, e2e/
 */

import { describe, it, beforeAll, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { markdownConfig } from '@lib/config/markdown'

interface TestFileMap {
  units: Set<string>
  integration: Set<string>
  e2e: Set<string>
}

type LocalPluginInfo = {
  dirName: string
  pluginName: string
  pluginNameKebab: string
  expectedUnitTestPath: string
  hasUnitTest: boolean
}

/**
 * Convert camelCase to kebab-case
 * Example: remarkBreaks -> remark-breaks
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function discoverLocalPlugins(pluginsRoot: string): Map<string, LocalPluginInfo> {
  const localPlugins = new Map<string, LocalPluginInfo>()

  // Discover local plugin modules via Vite glob. This catches both default exports
  // and named exports (e.g. rehype-tailwind exports rehypeTailwindClasses).
  const modules = import.meta.glob('../plugins/**/index.ts', { eager: true }) as Record<
    string,
    unknown
  >

  for (const [modulePath, moduleExports] of Object.entries(modules)) {
    const match = modulePath.match(/\.\.\/plugins\/(?<dir>.+)\/index\.ts$/)
    const dirName = match?.groups?.['dir']
    if (!dirName) continue

    const expectedUnitTestPath = join(pluginsRoot, dirName, '__tests__', 'index.spec.ts')

    const exportedFunctions: unknown[] = []
    const typed = moduleExports as Record<string, unknown> & { default?: unknown }

    if (typeof typed.default === 'function') exportedFunctions.push(typed.default)

    for (const [exportName, value] of Object.entries(typed)) {
      if (exportName === 'default') continue
      if (typeof value === 'function') exportedFunctions.push(value)
    }

    for (const fn of exportedFunctions) {
      const pluginName = (fn as { name?: unknown }).name
      if (typeof pluginName !== 'string') continue
      if (!/^(remark|rehype)[A-Z]/.test(pluginName)) continue
      if (localPlugins.has(pluginName)) continue

      const pluginNameKebab = toKebabCase(pluginName)
      const hasUnitTest = existsSync(expectedUnitTestPath)

      localPlugins.set(pluginName, {
        dirName,
        pluginName,
        pluginNameKebab,
        expectedUnitTestPath,
        hasUnitTest,
      })
    }
  }

  return localPlugins
}

let testFiles: TestFileMap
const localPlugins: Map<string, LocalPluginInfo> = discoverLocalPlugins(
  join(__dirname, '../plugins')
)

beforeAll(() => {
  const testRoot = join(__dirname)

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
          // Extract test name without extension
          // Units: remark-breaks.spec.ts -> remark-breaks
          // E2E: remark-breaks.spec.tsx -> remark-breaks
          const testName = item.replace(/\.spec\.tsx?$/, '')
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
    integration: scanDirectory(join(testRoot, 'integration')),
    e2e: scanDirectory(join(testRoot, 'e2e')),
  }
})

/**
 * Build test cases for each plugin
 */
function buildPluginTestCases(pluginType: 'remark' | 'rehype') {
  const plugins =
    pluginType === 'remark'
      ? markdownConfig.remarkPlugins || []
      : markdownConfig.rehypePlugins || []
  const testCases: Array<{ pluginName: string; pluginNameKebab: string; isLocal: boolean }> = []

  for (let index = 0; index < plugins.length; index++) {
    const pluginEntry = plugins[index] as any
    const plugin = Array.isArray(pluginEntry) ? pluginEntry[0] : pluginEntry
    const pluginName = (plugin as any).name || `plugin-${index}`
    const pluginNameKebab = toKebabCase(pluginName)
    const isLocal = localPlugins.has(pluginName)

    testCases.push({ pluginName, pluginNameKebab, isLocal })
  }

  return testCases
}

function maybeAddGfmRemarkTestCase(
  testCases: Array<{ pluginName: string; pluginNameKebab: string; isLocal: boolean }>
) {
  // markdownConfig.gfm enables remark-gfm internally (Astro wires it), so ensure it has coverage.
  if (markdownConfig.gfm !== false) {
    testCases.push({ pluginName: 'remarkGfm', pluginNameKebab: 'remark-gfm', isLocal: false })
  }
}

function getFriendlyMisplacedLocalTestMessage(pluginInfo: LocalPluginInfo): string {
  return [
    `Did you add the test file in the wrong place?`,
    `Local plugins must have their unit tests at: src/lib/markdown/plugins/${pluginInfo.dirName}/__tests__/index.spec.ts`,
    `Do not add local plugin tests under: src/lib/markdown/__tests__/units`,
  ].join(' ')
}

describe('Markdown Plugin Test Coverage', () => {
  describe('remarkPlugins', () => {
    const remarkPlugins = buildPluginTestCases('remark')
    maybeAddGfmRemarkTestCase(remarkPlugins)

    it.each(remarkPlugins)(
      'should have integration test for $pluginName',
      ({ pluginNameKebab }) => {
        expect(
          testFiles.integration.has(`${pluginNameKebab}-astro`),
          `Missing test in integration/${pluginNameKebab}-astro.spec.ts`
        ).toBe(true)
      }
    )

    it.each(remarkPlugins)('should have e2e test for $pluginName', ({ pluginName }) => {
      const pluginNameKebab = toKebabCase(pluginName)
      expect(
        testFiles.e2e.has(pluginNameKebab),
        `Missing test in e2e/${pluginNameKebab}.spec.tsx`
      ).toBe(true)
    })

    it.each(remarkPlugins.filter(p => !p.isLocal))(
      'should have units test for $pluginName (external plugin)',
      ({ pluginNameKebab }) => {
        expect(
          testFiles.units.has(pluginNameKebab),
          `Missing test in units/${pluginNameKebab}.spec.ts`
        ).toBe(true)
      }
    )

    it.each(remarkPlugins.filter(p => p.isLocal))(
      'should have unit test for $pluginName (local plugin)',
      ({ pluginName, pluginNameKebab }) => {
        const info = localPlugins.get(pluginName)
        expect(
          info?.hasUnitTest,
          info
            ? `Missing local plugin unit test: ${info.expectedUnitTestPath}`
            : `Missing local plugin folder: ${pluginNameKebab}`
        ).toBe(true)
      }
    )

    it.each(remarkPlugins.filter(p => p.isLocal))(
      'should not have a misplaced units test for $pluginName (local plugin)',
      ({ pluginName }) => {
        const info = localPlugins.get(pluginName)
        expect(info, `Expected local plugin metadata for ${pluginName}`).toBeTruthy()
        if (!info) return

        const hasMisplaced =
          testFiles.units.has(info.pluginNameKebab) ||
          testFiles.units.has(`${info.pluginNameKebab}-astro`)
        expect(hasMisplaced, getFriendlyMisplacedLocalTestMessage(info)).toBe(false)
      }
    )
  })

  describe('rehypePlugins', () => {
    const rehypePlugins = buildPluginTestCases('rehype')

    it.each(rehypePlugins)(
      'should have integration test for $pluginName',
      ({ pluginNameKebab }) => {
        expect(
          testFiles.integration.has(`${pluginNameKebab}-astro`),
          `Missing test in integration/${pluginNameKebab}-astro.spec.ts`
        ).toBe(true)
      }
    )

    it.each(rehypePlugins)('should have e2e test for $pluginName', ({ pluginName }) => {
      const pluginNameKebab = toKebabCase(pluginName)
      expect(
        testFiles.e2e.has(pluginNameKebab),
        `Missing test in e2e/${pluginNameKebab}.spec.tsx`
      ).toBe(true)
    })

    it.each(rehypePlugins.filter(p => !p.isLocal))(
      'should have units test for $pluginName (external plugin)',
      ({ pluginNameKebab }) => {
        expect(
          testFiles.units.has(pluginNameKebab),
          `Missing test in units/${pluginNameKebab}.spec.ts`
        ).toBe(true)
      }
    )

    it.each(rehypePlugins.filter(p => p.isLocal))(
      'should have unit test for $pluginName (local plugin)',
      ({ pluginName, pluginNameKebab }) => {
        const info = localPlugins.get(pluginName)
        expect(
          info?.hasUnitTest,
          info
            ? `Missing local plugin unit test: ${info.expectedUnitTestPath}`
            : `Missing local plugin folder: ${pluginNameKebab}`
        ).toBe(true)
      }
    )

    it.each(rehypePlugins.filter(p => p.isLocal))(
      'should not have a misplaced units test for $pluginName (local plugin)',
      ({ pluginName }) => {
        const info = localPlugins.get(pluginName)
        expect(info, `Expected local plugin metadata for ${pluginName}`).toBeTruthy()
        if (!info) return

        const hasMisplaced =
          testFiles.units.has(info.pluginNameKebab) ||
          testFiles.units.has(`${info.pluginNameKebab}-astro`)
        expect(hasMisplaced, getFriendlyMisplacedLocalTestMessage(info)).toBe(false)
      }
    )
  })
})
