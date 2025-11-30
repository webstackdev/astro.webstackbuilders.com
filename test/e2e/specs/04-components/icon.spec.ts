/**
 * Icon component regression tests
 * Ensures our gallery page mirrors the local svg set and that each icon remains accessible.
 */

import { BasePage, expect, test } from '@test/e2e/helpers'
import { colorClasses } from '@components/Icon/constants'
import type { Page } from '@playwright/test'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const iconVariants = Object.keys(colorClasses) as Array<keyof typeof colorClasses>
const firstVariant = (iconVariants[0] ?? 'default') as keyof typeof colorClasses
const selectors = {
  variantSection: (variant: string) => `section[aria-labelledby="icon-variant-${variant}"]`,
  iconSvg: 'svg[data-icon]'
}

async function readLocalIconNames(): Promise<string[]> {
  const iconsDir = path.resolve(process.cwd(), 'src/icons')
  const entries = await fs.readdir(iconsDir, { withFileTypes: true })

  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.svg'))
    .map(entry => entry.name.replace(/\.svg$/i, ''))
    .sort((a, b) => a.localeCompare(b))
}

async function setupIconGallery(playwrightPage: Page): Promise<BasePage> {
  const page = await BasePage.init(playwrightPage)
  await page.goto('/testing/icons')
  await page.waitForSelector(selectors.variantSection(firstVariant))
  await page.waitForSelector(`${selectors.variantSection(firstVariant)} ${selectors.iconSvg}`)
  return page
}

test.describe('Icon Component', () => {
  test('default variant renders every local icon exactly once', async ({ page: playwrightPage }) => {
    const page = await setupIconGallery(playwrightPage)
    const localIconNames = await readLocalIconNames()
    const defaultSection = page.locator(selectors.variantSection(firstVariant))
    const defaultVariantSvgs = defaultSection.locator(selectors.iconSvg)

    await expect(defaultVariantSvgs).toHaveCount(localIconNames.length)

    const renderedNames = (await defaultSection.locator('span.font-mono').allTextContents())
      .map(name => name.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))

    expect(renderedNames).toEqual(localIconNames)
  })

  test('each icon exposes a title element and valid SVG markup', async ({ page: playwrightPage }) => {
    const page = await setupIconGallery(playwrightPage)

    const auditResults = await page.evaluate((sectionSelector) => {
      const section = document.querySelector(sectionSelector)
      const missingTitles: string[] = []
      const invalidSvg: string[] = []

      if (!section) {
        return { missingTitles: ['icon-gallery-missing'], invalidSvg: ['icon-gallery-missing'] }
      }

      const svgNodes = Array.from(section.querySelectorAll<SVGSVGElement>('svg[data-icon]'))

      for (const svg of svgNodes) {
        const iconName = svg.getAttribute('data-icon') ?? 'unknown'
        const titleText = svg.querySelector('title')?.textContent?.trim()
        if (!titleText) {
          missingTitles.push(iconName)
        }

        const useElement = svg.querySelector('use')
        const href = useElement?.getAttribute('href') ?? ''
        const symbolId = href.startsWith('#') ? href.slice(1) : href
        const symbolElement = symbolId.length ? document.getElementById(symbolId) : null
        const isSvgElement = svg.namespaceURI === 'http://www.w3.org/2000/svg'
        const hasValidSymbol = Boolean(symbolElement && symbolElement.tagName.toLowerCase() === 'symbol')

        if (!isSvgElement || !hasValidSymbol) {
          invalidSvg.push(iconName)
        }
      }

      return { missingTitles, invalidSvg }
    }, selectors.variantSection(firstVariant))

    expect(auditResults.missingTitles, 'icons missing <title> text').toEqual([])
    expect(auditResults.invalidSvg, 'icons missing valid <symbol> references').toEqual([])
  })

  test('every color variant renders the complete icon set', async ({ page: playwrightPage }) => {
    const page = await setupIconGallery(playwrightPage)
    const expectedCount = await page.locator(selectors.variantSection(firstVariant)).locator(selectors.iconSvg).count()

    for (const variant of iconVariants) {
      const section = page.locator(selectors.variantSection(variant))
      await expect(section.locator(selectors.iconSvg)).toHaveCount(expectedCount)
    }
  })
})
