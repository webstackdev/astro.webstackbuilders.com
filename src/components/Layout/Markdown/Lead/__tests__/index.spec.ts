import { describe, expect, it, vi } from 'vitest'

import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { JSDOM } from 'jsdom'

import Lead from '../index.astro'

const fixtureModules = import.meta.glob(
  '../../../../Avatar/server/__fixtures__/avatars/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default' },
)

vi.mock('@components/Avatar/server/avatarImports', () => ({
  loadAvatarModules: () => fixtureModules,
}))

describe('Lead', () => {
  it('renders author link, publish date, optional modified date, and reading time', async () => {
    const container = await AstroContainer.create()

    const author = 'Kevin Brown'
    const publishDate = new Date('2025-12-12T00:00:00.000Z')
    const modifiedDate = new Date('2025-12-05T00:00:00.000Z')
    const readingTime = '8 min read'

    const html = await container.renderToString(Lead, {
      props: {
        author,
        publishDate,
        modifiedDate,
        readingTime,
      },
    })

    const dom = new JSDOM(html)
    const document = dom.window.document
    const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

    const primaryLineText = normalizeWhitespace(document.querySelector('.text-primary')?.textContent ?? '')

    expect(html).toContain('href="/about"')
    expect(html).toContain('Kevin Brown')
    expect(primaryLineText).toContain('Kevin Brown on Dec 12, 2025')
    expect(normalizeWhitespace(document.body.textContent ?? '')).toContain('Updated on Dec 5, 2025')
    expect(normalizeWhitespace(document.body.textContent ?? '')).toContain('8 min read')
  })

  it('does not render updated line when modifiedDate equals publishDate', async () => {
    const container = await AstroContainer.create()

    const publishDate = new Date('2025-12-12T00:00:00.000Z')

    const html = await container.renderToString(Lead, {
      props: {
        author: 'Kevin Brown',
        publishDate,
        modifiedDate: publishDate,
        readingTime: '8 min read',
      },
    })

    expect(html).not.toContain('Updated on')
  })
})
