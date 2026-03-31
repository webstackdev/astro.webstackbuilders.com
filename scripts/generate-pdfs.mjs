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

import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import puppeteer from 'puppeteer'

// --- Configuration ---

const SERVER_BASE = process.env.PDF_SERVER_URL ?? 'http://localhost:4321'
const OUTPUT_DIR = resolve('public/downloads')
const ARTICLES_DIR = resolve('src/content/articles')
const CONTACT_JSON = resolve('src/content/contact.json')
const slugFilter = process.argv[2] ?? null

// PDF page: US Letter (8.5 × 11 in)
const MARGIN = { top: '2cm', right: '2cm', bottom: '2.5cm', left: '2cm' }

// Content area in pixels at 96 DPI (for approximate ToC page-number calculation)
const CM_PER_IN = 2.54
const PAGE_HEIGHT_IN = 11
const MARGIN_TOP_IN = 2 / CM_PER_IN
const MARGIN_BOTTOM_IN = 2.5 / CM_PER_IN
const MARGIN_SIDE_IN = 2 / CM_PER_IN
const CONTENT_HEIGHT_PX = (PAGE_HEIGHT_IN - MARGIN_TOP_IN - MARGIN_BOTTOM_IN) * 96
const CONTENT_WIDTH_PX = (8.5 - 2 * MARGIN_SIDE_IN) * 96

// --- Templates ---

const contact = JSON.parse(readFileSync(CONTACT_JSON, 'utf-8')).company

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const buildHeaderTemplate = (title) =>
  `<div style="font-size:9pt; font-family:Arial,Helvetica,sans-serif; width:100%; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ccc; padding-bottom:4px;">
    <span style="font-weight:bold;">${esc(contact.name)}</span>
    <span style="color:#555; max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right;">${esc(title)}</span>
  </div>`

const footerTemplate =
  `<div style="font-size:8pt; font-family:Arial,Helvetica,sans-serif; width:100%; border-top:1px solid #ccc; padding-top:4px;">
    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
      <span>${esc(contact.address)}, ${esc(contact.city)}, ${esc(contact.state)} ${esc(contact.index)}</span>
      <span>${esc(contact.email)}</span>
    </div>
    <div style="text-align:center; color:#555;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  </div>`

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

    await page.goto(inputUrl, { waitUntil: 'networkidle0', timeout: 60_000 })
    await page.emulateMediaType('print')

    // Wait for web fonts so PDF typography matches the site instead of fallback metrics.
    await page.evaluate(() => {
      return globalThis.document.fonts.ready
    })

    // Wait for all images to finish loading
    await page.evaluate(() => {
      const doc = globalThis.document

      return Promise.all(
        Array.from(doc.images)
          .filter(img => !img.complete)
          .map(img => new Promise(r => { img.onload = r; img.onerror = r }))
      )
    })

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

    // Generate PDF
    await page.pdf({
      path: outputPdf,
      format: 'Letter',
      margin: MARGIN,
      displayHeaderFooter: true,
      headerTemplate: buildHeaderTemplate(title),
      footerTemplate,
      printBackground: true,
      preferCSSPageSize: false,
      tagged: true,
      outline: true,
    })

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
