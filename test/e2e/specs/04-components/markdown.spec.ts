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
      await expect(markdownPage.prose.locator('code', { hasText: 'inline code' }).first()).toBeVisible()

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

  test.describe('Inline code colors', () => {
    test('adds GitHub-like swatches for backticked color literals only', async () => {
      await expect(markdownPage.heading('Inline Code Colors', 2)).toBeVisible()

      const hexInlineCode = markdownPage.prose.locator('p code', { hasText: '#ffffff' }).first()
      await expect(hexInlineCode).toBeVisible()
      await expect(hexInlineCode).toContainText('#ffffff')

      const swatchWrapper = hexInlineCode.locator('span[data-color-swatch-wrapper="true"]').first()
      await expect(swatchWrapper).toBeVisible()

      const swatch = swatchWrapper.locator('span[data-color-swatch="true"]').first()
      await expect(swatch).toBeVisible()
      await expect(swatch).toHaveAttribute('style', /background-color:\s*#ffffff/i)

      const nonColorInlineCode = markdownPage.prose.locator('p code', { hasText: 'inline code' }).first()
      await expect(nonColorInlineCode).toBeVisible()
      await expect(nonColorInlineCode.locator('span[data-color-swatch-wrapper="true"]')).toHaveCount(0)

      const hexInCodeBlock = markdownPage.prose.locator('pre code', { hasText: '#ffffff' }).first()
      await expect(hexInCodeBlock).toBeVisible()
      await expect(hexInCodeBlock.locator('span[data-color-swatch-wrapper="true"]')).toHaveCount(0)
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

  test.describe('remark-attributes', () => {
    test('applies [[...]] attributes to supported elements', async () => {
      await expect(markdownPage.heading('Remark Attributes (remark-attributes)', 2)).toBeVisible()

      const heading = markdownPage.prose.getByRole('heading', { name: 'Remark attributes heading', level: 3 })
      await expect(heading).toBeVisible()
      await expect(heading).toHaveAttribute('id', 'remark-attr-heading')
      await expect(heading).toHaveAttribute('class', /\battr-heading\b/)
      await expect(heading).toHaveAttribute('data-level', '1')

      const link = markdownPage.prose.getByRole('link', { name: 'Home link with attrs', exact: true })
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', '/')
      await expect(link).toHaveAttribute('class', /\battr-link\b/)
      await expect(link).toHaveAttribute('data-qa', 'remark-attr-link')

      const image = markdownPage.prose.getByRole('img', { name: 'Remark attributes image' })
      await expect(image).toBeVisible()
      await expect(image).toHaveAttribute('width', '300')
      await expect(image).toHaveAttribute('height', '64')
      await expect(image).toHaveAttribute('class', /\battr-image\b/)
      await expect(image).toHaveAttribute('data-qa', 'remark-attr-image')

      const inlineCode = markdownPage.prose.locator('p code', { hasText: 'attr-code' }).first()
      await expect(inlineCode).toBeVisible()
      await expect(inlineCode).toHaveAttribute('class', /\battr-code\b/)
      await expect(inlineCode).toHaveAttribute('data-qa', 'remark-attr-code')
    })
  })

  test.describe('remark-video', () => {
    test('renders an HTML5 video element from :::video directive syntax', async () => {
      await expect(markdownPage.heading('Video (remark-video)', 2)).toBeVisible()

      const figure = markdownPage.prose.locator('[data-remark-video-figure]').first()
      await expect(figure).toBeVisible()

      const video = figure.locator('video').first()
      await expect(video).toBeVisible()
      await expect(video).toHaveJSProperty('controls', true)
      await expect(video).toHaveAttribute('preload', 'metadata')
      await expect(video).toHaveAttribute('width', '100%')

      const source = video.locator('source').first()
      await expect(source).toHaveCount(1)
      await expect(source).toHaveAttribute('src', '/videos/sample-video-1.mp4')
      await expect(source).toHaveAttribute('type', 'video/mp4')
    })
  })

  test.describe('remark-youtube', () => {
    test('renders YouTube URLs as embedded iframes', async () => {
      await expect(markdownPage.heading('YouTube (remark-youtube)', 2)).toBeVisible()

      const embeds = markdownPage.prose.locator('iframe[src="https://www.youtube.com/embed/enTFE2c68FQ"]')
      await expect(embeds).toHaveCount(2)

      const first = embeds.first()
      await expect(first).toHaveAttribute('width', '560')
      await expect(first).toHaveAttribute('height', '315')
      await expect(first).toHaveAttribute('frameborder', '0')
      await expect(first).toHaveAttribute('allow', /accelerometer;\s*autoplay;\s*clipboard-write;\s*encrypted-media;/)
      await expect(first).toHaveAttribute('allowfullscreen', /^(|true)$/)

      // URLs should be replaced by embeds, not rendered as link text.
      await expect(markdownPage.prose).not.toContainText('https://youtu.be/enTFE2c68FQ')
      await expect(markdownPage.prose).not.toContainText('https://www.youtube.com/watch?v=enTFE2c68FQ')
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

  test.describe('Math (remark-math + rehype-mathjax)', () => {
    test('renders TeX as SVG at build-time (no client-side MathJax)', async ({ page }) => {
      await expect(markdownPage.heading('Math (remark-math + rehype-mathjax)', 2)).toBeVisible()

      const mjx = markdownPage.prose.locator('mjx-container[jax="SVG"]')
      const mjxCount = await mjx.count()
      expect(mjxCount).toBeGreaterThanOrEqual(1)

      await expect(mjx.first().locator('svg')).toBeVisible()

      await expect(markdownPage.prose.locator('code.language-math')).toHaveCount(0)

      await expect(markdownPage.prose).toContainText('Single-dollar stays text')
      await expect(markdownPage.prose).toContainText('$x$')

      await expect(page.locator('script[src*="mathjax" i]')).toHaveCount(0)
    })

    test('does not force line breaks for hard-wrapped prose', async () => {
      const paragraph = markdownPage.prose.locator('p', { hasText: 'Lift(' }).first()
      await expect(paragraph).toBeVisible()

      const renderedText = await paragraph.evaluate(node => {
        if (node instanceof HTMLElement) {
          return node.innerText ?? ''
        }

        return node.textContent ?? ''
      })
      expect(renderedText).toContain('like the following equation.')
      expect(renderedText).not.toContain('like the following\nequation.')

      const rawHtml = await paragraph.evaluate(node => node.innerHTML)
      expect(rawHtml.toLowerCase()).not.toContain('<br')

      const mjxSvg = paragraph.locator('mjx-container[jax="SVG"] svg').first()
      await expect(mjxSvg).toBeVisible()

      const svgDisplay = await mjxSvg.evaluate(node => window.getComputedStyle(node).display)
      expect(svgDisplay).not.toBe('block')
    })
  })

  test.describe('remark-captions', () => {
    test('wraps captioned elements in figure/figcaption', async () => {
      await expect(markdownPage.heading('Captions (remark-captions)', 2)).toBeVisible()

      // Blockquote caption (internal)
      const quoteFigure = markdownPage.prose.locator('figure:has(blockquote)').first()
      await expect(quoteFigure).toBeVisible()
      await expect(quoteFigure.locator('figcaption', { hasText: 'Yoda' })).toBeVisible()

      // Table caption (external)
      const tableFigure = markdownPage.prose.locator('figure:has(table)').filter({ hasText: 'My table caption' }).first()
      await expect(tableFigure).toBeVisible()
      await expect(tableFigure.locator('figcaption', { hasText: 'My table caption' })).toBeVisible()

      // Code caption (external)
      const codeFigure = markdownPage.prose.locator('figure:has(pre)').filter({ hasText: 'My code caption' }).first()
      await expect(codeFigure).toBeVisible()
      await expect(codeFigure.locator('figcaption', { hasText: 'My code caption' })).toBeVisible()

      // Image caption (internal)
      const imageFigure = markdownPage.prose.locator('figure:has(img)').filter({ hasText: 'My image caption' }).first()
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

      const table = markdownPage.prose.locator('#table + table').first()
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
