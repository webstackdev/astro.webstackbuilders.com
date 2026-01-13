import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import { rehypeTailwindClasses } from '@lib/markdown/plugins/rehype-tailwind'
import { JSDOM } from 'jsdom'

const readFixture = (name: string): string => {
  const path = fileURLToPath(new URL(`../__fixtures__/${name}`, import.meta.url))
  return readFileSync(path, 'utf8')
}

const runPlugin = async (html: string): Promise<string> => {
  const result = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeTailwindClasses)
    .use(rehypeStringify)
    .process(html)

  return String(result)
}

const renderFixtureToDocument = async (name: string): Promise<Document> => {
  const html = readFixture(name)
  const transformedHtml = await runPlugin(html)
  return new JSDOM(transformedHtml).window.document
}

const getRequiredElement = <T extends Element>(element: T | null, name: string): T => {
  if (!element) throw new Error(`Expected to find element: ${name}`)
  return element
}

describe('rehype-tailwind utils (fixture-driven)', () => {
  it('styles inline <code>', async () => {
    const document = await renderFixtureToDocument('inline-code.html')

    const code = getRequiredElement(document.querySelector('code'), 'code')
    expect(code.textContent).toBe('npm run dev')
    expect(document.querySelector('pre')).toBeNull()

    const paragraph = getRequiredElement(document.querySelector('p'), 'p')
    const paragraphText = paragraph.textContent?.trim() ?? ''
    expect(paragraphText.length).toBeGreaterThan(0)
    expect(paragraphText).toContain('Use')
  })

  it('does not treat <pre><code> as inline code', async () => {
    const document = await renderFixtureToDocument('code-block.html')

    const pre = getRequiredElement(document.querySelector('pre'), 'pre')
    expect(pre.textContent?.trim().length).toBeGreaterThan(0)

    const code = getRequiredElement(pre.querySelector('code'), 'pre > code')
    expect(code.getAttribute('class')).toContain('language-ts')
  })

  it('supports <code-tabs> web component markup', async () => {
    const document = await renderFixtureToDocument('code-tabs-element.html')

    const codeTabs = getRequiredElement(document.querySelector('code-tabs'), 'code-tabs')
    expect(codeTabs.getAttribute('class')).toContain('code-tabs')

    const tabPanels = Array.from(codeTabs.querySelectorAll('pre'))
    expect(tabPanels).toHaveLength(2)
    expect(tabPanels[0]?.getAttribute('data-code-tabs-group')).toBe('g1')
    expect(tabPanels[0]?.getAttribute('data-code-tabs-tab')).toBe('JavaScript')

    expect(codeTabs.querySelector('input')).toBeNull()
    expect(codeTabs.querySelector('label')).toBeNull()
  })
})
