import { describe, it, expect } from 'vitest'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

function noopRehypePlugin() {
  return (tree: unknown) => tree
}

describe('rehypeHeadingIds (Layer 2: With Astro Pipeline)', () => {
  it('adds deterministic ids to headings', async () => {
    const markdown = `
# Hello World

## A heading with punctuation!
`

    const html = await processWithAstroSettings({
      markdown,
      plugin: noopRehypePlugin,
      stage: 'rehype',
    })

    expect(html).toContain('<h1')
    expect(html).toContain('id="hello-world"')

    expect(html).toContain('<h2')
    expect(html).toContain('id="a-heading-with-punctuation"')
  })

  it('deduplicates ids across repeated headings', async () => {
    const markdown = `
# Hello World

## Hello World

## Hello World
`

    const html = await processWithAstroSettings({
      markdown,
      plugin: noopRehypePlugin,
      stage: 'rehype',
    })

    expect(html).toContain('id="hello-world"')
    expect(html).toContain('id="hello-world-1"')
    expect(html).toContain('id="hello-world-2"')
  })
})
