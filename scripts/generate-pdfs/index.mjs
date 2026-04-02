#!/usr/bin/env node

/**
 * Generate PDFs from /print/ pages using Puppeteer.
 *
 * Usage:
 * - node scripts/generate-pdfs.mjs <slug>       # single article
 * - node scripts/generate-pdfs.mjs              # all deep dive articles
 * - OR npm run pdf:generate
 *
 * Requires a running server (dev or preview) at localhost:4321.
 * Set PDF_SERVER_URL to override the server base URL.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import puppeteer from 'puppeteer'
import { buildHeaderTemplate, footerTemplate } from './html.mjs'

// --- Configuration ---

const SERVER_BASE = process.env.PDF_SERVER_URL ?? 'http://localhost:4321'
const OUTPUT_DIR = resolve('public/downloads')
const ARTICLES_DIR = resolve('src/content/articles')
const slugFilter = process.argv[2] ?? null

// PDF page: US Letter (8.5 × 11 in)
// These values must stay in sync with `.print-document` padding in
// src/pages/print/index.css so the viewport and ToC pagination math reflect
// the actual printable content box.
const CONTENT_TOP_PADDING_CM = 3
const CONTENT_BOTTOM_PADDING_CM = 2.5
const CONTENT_SIDE_PADDING_CM = 1.5
const CONTENT_PADDING_CM = {
  top: CONTENT_TOP_PADDING_CM,
  right: CONTENT_SIDE_PADDING_CM,
  bottom: CONTENT_BOTTOM_PADDING_CM,
  left: CONTENT_SIDE_PADDING_CM,
}
const PDF_MARGIN = { top: '0px', right: '0px', bottom: '0px', left: '0px' }

// Content area in pixels at 96 DPI (for approximate ToC page-number calculation)
const CM_PER_IN = 2.54
const PAGE_HEIGHT_IN = 11
const CONTENT_PADDING_TOP_IN = CONTENT_PADDING_CM.top / CM_PER_IN
const CONTENT_PADDING_BOTTOM_IN = CONTENT_PADDING_CM.bottom / CM_PER_IN
const CONTENT_PADDING_LEFT_IN = CONTENT_PADDING_CM.left / CM_PER_IN
const CONTENT_PADDING_RIGHT_IN = CONTENT_PADDING_CM.right / CM_PER_IN
const CONTENT_HEIGHT_PX = (PAGE_HEIGHT_IN - CONTENT_PADDING_TOP_IN - CONTENT_PADDING_BOTTOM_IN) * 96
const CONTENT_WIDTH_PX = (8.5 - CONTENT_PADDING_LEFT_IN - CONTENT_PADDING_RIGHT_IN) * 96
const ASSET_SETTLE_TIMEOUT_MS = 30_000
const LAYOUT_SETTLE_DELAY_MS = 500

// --- Templates ---


// --- Slug collection ---

const collectAllSlugs = () => {
  if (!existsSync(ARTICLES_DIR)) return []
  return readdirSync(ARTICLES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(join(ARTICLES_DIR, e.name, 'pdf.mdx')))
    .map(e => e.name)
    .sort()
}

// --- Server check ---

const checkServer = async () => {
  try {
    await fetch(SERVER_BASE, { signal: AbortSignal.timeout(5000) })
    return true
  } catch {
    return false
  }
}

const buildPdfOptions = ({
  title,
  includeHeaderFooter,
  pageRanges,
}) => {
  return {
    format: 'Letter',
    margin: PDF_MARGIN,
    displayHeaderFooter: includeHeaderFooter,
    ...(includeHeaderFooter
      ? {
          headerTemplate: buildHeaderTemplate(title ?? ''),
          footerTemplate,
        }
      : {}),
    printBackground: true,
    preferCSSPageSize: false,
    tagged: true,
    outline: true,
    ...(pageRanges ? { pageRanges } : {}),
  }
}

const writeMergedPdf = async ({ coverPdfBytes, fullPdfBytes, outputPdf }) => {
  const mergedPdf = await PDFDocument.create()
  const coverPdf = await PDFDocument.load(coverPdfBytes)
  const fullPdf = await PDFDocument.load(fullPdfBytes)

  const [coverPage] = await mergedPdf.copyPages(coverPdf, [0])
  mergedPdf.addPage(coverPage)

  const remainingPageIndices = fullPdf.getPageIndices().slice(1)
  if (remainingPageIndices.length > 0) {
    const remainingPages = await mergedPdf.copyPages(fullPdf, remainingPageIndices)
    for (const pdfPage of remainingPages) {
      mergedPdf.addPage(pdfPage)
    }
  }

  writeFileSync(outputPdf, await mergedPdf.save())
}

const wait = (durationMs) => new Promise(resolve => setTimeout(resolve, durationMs))

const forceLazyAssetsToLoad = async (page) => {
  await page.evaluate(async () => {
    const documentRoot = globalThis.document.scrollingElement ?? globalThis.document.documentElement
    const pause = (durationMs) => new Promise(resolve => globalThis.setTimeout(resolve, durationMs))
    const viewportHeight = globalThis.innerHeight || 800
    const step = Math.max(200, Math.floor(viewportHeight * 0.9))

    for (const image of Array.from(globalThis.document.images)) {
      image.loading = 'eager'
      image.decoding = 'sync'

      if ('fetchPriority' in image) {
        image.fetchPriority = 'high'
      }
    }

    for (let top = 0; top < documentRoot.scrollHeight; top += step) {
      documentRoot.scrollTop = top
      await pause(50)
    }

    documentRoot.scrollTop = 0
    await pause(50)
  })
}

const waitForPageAssets = async (page) => {
  await page.evaluate(async (timeoutMs) => {
    const pause = (durationMs) => new Promise(resolve => globalThis.setTimeout(resolve, durationMs))
    const withTimeout = async (promiseFactory) => {
      const timeoutPromise = pause(timeoutMs)

      try {
        await Promise.race([promiseFactory(), timeoutPromise])
      } catch {
        await timeoutPromise
      }
    }

    if (globalThis.document.fonts?.ready) {
      await withTimeout(() => globalThis.document.fonts.ready)
    }

    await Promise.allSettled(
      Array.from(globalThis.document.images).map(async (image) => {
        image.loading = 'eager'
        image.decoding = 'sync'

        if ('fetchPriority' in image) {
          image.fetchPriority = 'high'
        }

        if (!image.complete) {
          await withTimeout(() => new Promise(resolve => {
            const done = () => {
              image.removeEventListener('load', done)
              image.removeEventListener('error', done)
              resolve()
            }

            image.addEventListener('load', done, { once: true })
            image.addEventListener('error', done, { once: true })
          }))
        }

        if (typeof image.decode === 'function') {
          await withTimeout(() => image.decode())
        }
      })
    )
  }, ASSET_SETTLE_TIMEOUT_MS)
}

// --- PDF generation ---

const generatePdf = async (browser, slug) => {
  const inputUrl = `${SERVER_BASE}/print/${slug}`
  const outputPdf = join(OUTPUT_DIR, `${slug}.pdf`)

  console.log(`  ${slug}`)
  console.log(`    input:  ${inputUrl}`)
  console.log(`    output: ${outputPdf}`)

  const page = await browser.newPage()

  try {
    // Viewport matches PDF content area for more accurate measurement
    await page.setViewport({
      width: Math.round(CONTENT_WIDTH_PX),
      height: Math.round(CONTENT_HEIGHT_PX),
    })

    await page.goto(inputUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.emulateMediaType('print')

    await forceLazyAssetsToLoad(page)
    await waitForPageAssets(page)

    // Final settle — give any remaining layout shifts a moment to resolve
    await wait(LAYOUT_SETTLE_DELAY_MS)

    const title = await page.title()

    // Inject approximate page numbers into the ToC
    await page.evaluate((contentH) => {
      const doc = globalThis.document
      const toc = doc.querySelector('.print-toc')
      const article = doc.querySelector('.print-article')
      if (!toc || !article) return

      // Cover always occupies 1 page (break-after: page)
      const coverPages = 1
      const tocPages = Math.max(1, Math.ceil(toc.getBoundingClientRect().height / contentH))
      const pagesBeforeArticle = coverPages + tocPages

      const articleTop = article.getBoundingClientRect().top
      const pageMap = new Map()

      for (const h of article.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')) {
        const offset = h.getBoundingClientRect().top - articleTop
        pageMap.set(h.id, pagesBeforeArticle + Math.floor(Math.max(0, offset) / contentH) + 1)
      }

      for (const span of doc.querySelectorAll('.print-toc__page')) {
        const href = span.closest('a')?.getAttribute('href')?.replace('#', '')
        if (href && pageMap.has(href)) {
          span.textContent = String(pageMap.get(href))
        }
      }
    }, CONTENT_HEIGHT_PX)

    const [coverPdfBytes, fullPdfBytes] = await Promise.all([
      page.pdf(buildPdfOptions({ includeHeaderFooter: false, pageRanges: '1' })),
      page.pdf(buildPdfOptions({ includeHeaderFooter: true, title })),
    ])

    await writeMergedPdf({ coverPdfBytes, fullPdfBytes, outputPdf })

    console.log('    ✓ done\n')
    return true
  } catch (error) {
    console.error(`    ✗ FAILED: ${error.message ?? error}\n`)
    return false
  } finally {
    await page.close()
  }
}

// --- Main ---

mkdirSync(OUTPUT_DIR, { recursive: true })

if (!(await checkServer())) {
  console.error(`ERROR: No server running at ${SERVER_BASE}`)
  console.error('Start the dev server (npm run dev) or preview server (npm run preview) first.')
  process.exit(1)
}

if (slugFilter) {
  const pdfMdx = join(ARTICLES_DIR, slugFilter, 'pdf.mdx')
  if (!existsSync(pdfMdx)) {
    console.error(`ERROR: No pdf.mdx found for "${slugFilter}"`)
    console.error(`Expected: ${pdfMdx}`)
    process.exit(1)
  }
}

const slugs = slugFilter ? [slugFilter] : collectAllSlugs()

if (slugs.length === 0) {
  console.error('ERROR: No deep dive articles with pdf.mdx found.')
  process.exit(1)
}

console.log(`Generating ${slugs.length} PDF(s) from ${SERVER_BASE}...\n`)

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

let succeeded = 0
let failed = 0

try {
  for (const slug of slugs) {
    const ok = await generatePdf(browser, slug)
    if (ok) succeeded++
    else failed++
  }
} finally {
  await browser.close()
}

if (slugs.length > 1) {
  console.log(`Results: ${succeeded} succeeded, ${failed} failed out of ${slugs.length} total`)
}

process.exit(failed > 0 ? 1 : 0)
