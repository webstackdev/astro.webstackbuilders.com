/**
 * Markdown / MDX regression coverage
 *
 * Uses a dedicated MDX page fixture rendered through the production markdown pipeline.
 * Goal: catch regressions if Astro MDX internals or Unified plugin wiring changes.
 */

import { test, expect } from '@test/e2e/helpers'
import { MarkdownPage } from '@test/e2e/helpers/pageObjectModels/MarkdownPage'

test.describe('Markdown (MDX) fixture page', () => {
  let markdownPage: MarkdownPage

  test.beforeEach(async ({ page }) => {
    markdownPage = await MarkdownPage.init(page)
    await markdownPage.gotoFixture()

    await expect(markdownPage.article).toBeVisible()
    await expect(markdownPage.articleTitle).toBeVisible()
    await expect(markdownPage.articleTitle).toHaveText('Markdown E2E Fixture')
  })

  test.describe('Basic built-in markdown', () => {
    test('renders emphasis, links, and code blocks', async () => {
      await expect(markdownPage.heading('Basic Markdown', 2)).toBeVisible()
      await expect(markdownPage.prose).toContainText('This is bold, italic, and inline code')

      await expect(markdownPage.prose.locator('strong', { hasText: 'bold' })).toBeVisible()
      await expect(markdownPage.prose.locator('em', { hasText: 'italic' })).toBeVisible()
      await expect(markdownPage.prose.locator('code', { hasText: 'inline code' })).toBeVisible()

      const homeLink = markdownPage.prose.getByRole('link', { name: 'homepage' })
      await expect(homeLink).toHaveAttribute('href', '/')
      await expect(homeLink).not.toHaveAttribute('target', '_blank')

      const externalLink = markdownPage.prose.getByRole('link', { name: 'Example', exact: true })
      await expect(externalLink).toHaveAttribute('href', 'https://example.com')
      await expect(externalLink).toHaveAttribute('target', '_blank')
      await expect(externalLink).toHaveAttribute('rel', 'noreferrer')

      await expect(markdownPage.prose.locator('pre code', { hasText: '"Hello" -- ...' })).toBeVisible()
    })
  })

  test.describe('Heading anchors', () => {
    test('adds slugified ids and in-heading anchor links', async () => {
      await expect(markdownPage.heading('Heading Anchors', 2)).toBeVisible()

      const sectionHeading = markdownPage.heading('My Section Heading', 3)
      await expect(sectionHeading).toBeVisible()
      await expect(sectionHeading).toHaveAttribute('id', 'my-section-heading')

      const anchorInHeading = sectionHeading.locator('a')
      await expect(anchorInHeading.first()).toHaveAttribute('href', '#my-section-heading')

      const internalLink = markdownPage.prose.getByRole('link', { name: 'My Section Heading' })
      await expect(internalLink).toHaveAttribute('href', '#my-section-heading')
    })
  })

  test.describe('remark-align', () => {
    test('wraps inline and block ranges with Tailwind classes', async () => {
      await expect(markdownPage.heading('Align (remark-align)', 2)).toBeVisible()

      // Inline alignment wrapper
      const inline = markdownPage.prose.locator('div.text-center').first()
      await expect(inline).toBeVisible()
      await expect(inline).toContainText('A centered paragraph')

      // Block alignment wrapper (column layout)
      const block = markdownPage.prose.locator('div.flex.flex-col.items-center').first()
      await expect(block).toBeVisible()
      await expect(block).toContainText('Centered block')
      await expect(block.locator('li')).toHaveCount(2)

      // Row variant (flex row + justify)
      const row = markdownPage.prose.locator('div.flex.justify-end').first()
      await expect(row).toBeVisible()
      await expect(row).toContainText('Right row block')

      // Tags should not leak into output text
      await expect(markdownPage.prose).not.toContainText('[center]')
      await expect(markdownPage.prose).not.toContainText('[/center]')
    })
  })

  test.describe('remark-custom-blocks', () => {
    test('renders details blocks with summary and contents', async () => {
      await expect(markdownPage.heading('Custom Blocks (remark-custom-blocks)', 2)).toBeVisible()

      const details = markdownPage.prose.locator('details').first()
      await expect(details).toBeVisible()

      const summary = details.locator('summary').first()
      await expect(summary).toBeVisible()
      await expect(summary).toHaveText('My summary')

      await expect(details).toContainText('Some content for the detail')
      await expect(details).toContainText('Second line')
    })
  })

  test.describe('remark-supersub', () => {
    test('renders subscript and superscript elements', async () => {
      await expect(markdownPage.heading('Supersub (remark-supersub)', 2)).toBeVisible()

      const sub = markdownPage.prose.locator('sub', { hasText: 'i' }).first()
      await expect(sub).toBeVisible()

      const sup = markdownPage.prose.locator('sup', { hasText: 'x' }).first()
      await expect(sup).toBeVisible()
    })
  })

  test.describe('remark-mark-plus', () => {
    test('renders mark elements from ==highlight== syntax', async () => {
      await expect(markdownPage.heading('Mark Plus (remark-mark-plus)', 2)).toBeVisible()

      const mark = markdownPage.prose.locator('mark', { hasText: 'marked' }).first()
      await expect(mark).toBeVisible()
    })
  })

  test.describe('remark-captions', () => {
    test('wraps captioned elements in figure/figcaption', async () => {
      await expect(markdownPage.heading('Captions (remark-captions)', 2)).toBeVisible()

      // Blockquote caption (internal)
      const quoteFigure = markdownPage.prose.locator('figure', { has: markdownPage.prose.locator('blockquote') }).first()
      await expect(quoteFigure).toBeVisible()
      await expect(quoteFigure.locator('figcaption', { hasText: 'Yoda' })).toBeVisible()

      // Table caption (external)
      const tableFigure = markdownPage.prose.locator('figure', { has: markdownPage.prose.locator('table') }).first()
      await expect(tableFigure).toBeVisible()
      await expect(tableFigure.locator('figcaption', { hasText: 'My table caption' })).toBeVisible()

      // Code caption (external)
      const codeFigure = markdownPage.prose.locator('figure', { has: markdownPage.prose.locator('pre') }).first()
      await expect(codeFigure).toBeVisible()
      await expect(codeFigure.locator('figcaption', { hasText: 'My code caption' })).toBeVisible()

      // Image caption (internal)
      const imageFigure = markdownPage.prose.locator('figure', { has: markdownPage.prose.locator('img') }).first()
      await expect(imageFigure).toBeVisible()
      await expect(imageFigure.locator('figcaption', { hasText: 'My image caption' })).toBeVisible()
    })
  })

  test.describe('GFM', () => {
    test('renders autolinks, tables, task lists, strikethrough, and footnotes', async () => {
      await expect(markdownPage.heading('GFM', 2)).toBeVisible()

      const httpAutolink = markdownPage.prose.locator('a[href="http://www.example.com"]')
      await expect(httpAutolink).toBeVisible()
      await expect(httpAutolink).toHaveAttribute('target', '_blank')
      await expect(httpAutolink).toHaveAttribute('rel', 'noreferrer')

      const httpsAutolink = markdownPage.prose.locator('a[href="https://example.com"]', { hasText: 'https://example.com' })
      await expect(httpsAutolink).toBeVisible()
      await expect(httpsAutolink).toHaveAttribute('target', '_blank')
      await expect(httpsAutolink).toHaveAttribute('rel', 'noreferrer')

      const mailtoAutolink = markdownPage.prose.locator('a[href^="mailto:"]', { hasText: 'contact@example.com' })
      await expect(mailtoAutolink).toBeVisible()
      await expect(mailtoAutolink).not.toHaveAttribute('target', '_blank')

      await expect(markdownPage.prose.locator('del', { hasText: 'This was mistaken text' })).toBeVisible()

      const table = markdownPage.prose.locator('table').first()
      await expect(table).toBeVisible()
      await expect(table).toContainText('Feature')
      await expect(table).toContainText('Tables')

      const gridTable = markdownPage.prose.locator('table', { hasText: 'Grid' }).first()
      await expect(gridTable).toBeVisible()
      await expect(gridTable.locator('em', { hasText: 'formatted' })).toBeVisible()

      const checkboxes = markdownPage.prose.locator('input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()
      expect(checkboxCount).toBeGreaterThanOrEqual(2)
      await expect(checkboxes.nth(1)).toBeChecked()

      const definitionList = markdownPage.prose.locator('dl').first()
      await expect(definitionList).toBeVisible()
      await expect(definitionList).toContainText('Term 1')
      await expect(definitionList).toContainText('Definition 1')

      await expect(markdownPage.footnoteRef).toBeVisible()
      const targetId = await markdownPage.getFootnoteTargetIdFromHref()
      expect(targetId).toBeTruthy()

      if (targetId) {
        await expect(markdownPage.footnoteDefinitionById(targetId)).toBeVisible()
      }

      await expect(markdownPage.footnotesSection).toBeVisible()

      const footnoteBackref = markdownPage.prose.locator('a[data-footnote-backref]').first()
      await expect(footnoteBackref).toBeVisible()
      await expect(footnoteBackref).toHaveAttribute('title', 'Return to footnote 1')
    })
  })
})
