/**
 * Icon component regression tests
 * Ensures our gallery page mirrors the local svg set and that each icon remains accessible.
 */

import { BasePage, expect, test } from '@test/e2e/helpers'
import type { Page } from '@playwright/test'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const selectors = {
  gallerySection: 'section[aria-labelledby="marker-gallery"]',
  iconSvg: 'svg'
}

async function readLocalIconNames(): Promise<string[]> {
  const iconsDir = path.resolve(process.cwd(), 'src/components/Icon/icons')
  const entries = await fs.readdir(iconsDir, { withFileTypes: true })

  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.astro'))
    .map(entry => entry.name.replace(/\.astro$/i, ''))
    .sort((a, b) => a.localeCompare(b))
}

async function setupIconGallery(playwrightPage: Page): Promise<BasePage> {
  const page = await BasePage.init(playwrightPage)
  await page.goto('/testing/comps/icons')
  await page.waitForSelector(selectors.gallerySection)
  await page.waitForSelector(`${selectors.gallerySection} ${selectors.iconSvg}`)
  return page
}

test.describe('Icon Component', () => {
  test('primary gallery renders every local icon exactly once', async ({ page: playwrightPage }) => {
    const page = await setupIconGallery(playwrightPage)
    const localIconNames = await readLocalIconNames()
    const gallerySection = page.locator(selectors.gallerySection)
    const gallerySvgs = gallerySection.locator(selectors.iconSvg)

    await expect(gallerySvgs).toHaveCount(localIconNames.length)

    const renderedNames = (await gallerySection.locator('span.font-mono').allTextContents())
      .map(name => name.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))

    expect(renderedNames).toEqual(localIconNames)
  })

  test('each icon renders valid decorative SVG markup', async ({ page: playwrightPage }) => {
    const page = await setupIconGallery(playwrightPage)

    const auditResults = await page.evaluate((sectionSelector) => {
      const section = document.querySelector(sectionSelector)
      const invalidSvg: string[] = []

      if (!section) {
        return { invalidSvg: ['icon-gallery-missing'] }
      }

      const cards = Array.from(section.querySelectorAll<HTMLElement>('div.flex.min-w-50'))

      for (const card of cards) {
        const svg = card.querySelector<SVGSVGElement>('svg')
        const iconName = card.querySelector('span.font-mono')?.textContent?.trim() ?? 'unknown'
        if (!svg) {
          invalidSvg.push(iconName)
          continue
        }

        const titleText = svg.querySelector('title')?.textContent?.trim()
        const isSvgElement = svg.namespaceURI === 'http://www.w3.org/2000/svg'
        const hasViewBox = Boolean(svg.getAttribute('viewBox'))
        const hasAriaHidden = svg.getAttribute('aria-hidden') === 'true'
        const hasNonEmptyTitleWhenPresent = titleText === undefined || titleText.length > 0

        if (!isSvgElement || !hasViewBox || !hasAriaHidden || !hasNonEmptyTitleWhenPresent) {
          invalidSvg.push(iconName)
        }
      }

      return { invalidSvg }
    }, selectors.gallerySection)

    expect(auditResults.invalidSvg, 'icons with invalid decorative SVG markup').toEqual([])
  })

  test('gallery renders the complete icon set in the primary color variant', async ({ page: playwrightPage }) => {
    const page = await setupIconGallery(playwrightPage)
    const gallerySection = page.locator(selectors.gallerySection)
    const iconCount = await gallerySection.locator(selectors.iconSvg).count()
    const localIconNames = await readLocalIconNames()

    await expect(page.locator('#marker-gallery')).toHaveText('primary')
    expect(iconCount).toBe(localIconNames.length)
  })
})
