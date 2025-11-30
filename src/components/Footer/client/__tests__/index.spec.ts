
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Footer from '@components/Footer/index.astro'
import type { FooterElement } from '@components/Footer/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

vi.mock('@components/scripts/utils/absoluteUrl', () => ({
  absoluteUrl: (route: string) => `https://example.com${route}`,
}))

type FooterComponentModule = WebComponentModule<FooterElement>

const renderFooter = async (
  assertion: (_context: { element: FooterElement }) => Promise<void> | void,
) => {
  const container = await AstroContainer.create({
    astroConfig: {
      site: 'https://example.com',
    },
  })

  await executeRender<FooterComponentModule>({
    container,
    component: Footer,
    moduleSpecifier: '@components/Footer/client/index',
    assert: async ({ element }) => {
      await assertion({ element })
    },
  })
}

describe('FooterElement web component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-10-17T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates the Hire Me anchor copy and display state when connected', async () => {
    await renderFooter(({ element }) => {
      const hireMeAnchor = element.querySelector<HTMLAnchorElement>('#page-footer__hire-me-anchor')

      expect(hireMeAnchor).toBeInstanceOf(HTMLAnchorElement)
      expect(hireMeAnchor?.innerHTML).toBe('Available September, 2024. Hire Me Now')
      expect(hireMeAnchor?.style.display).toBe('inline-block')
    })
  })
})
