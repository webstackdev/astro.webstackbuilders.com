// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Footer from '@components/Footer/index.astro'
import type { FooterElement } from '@components/Footer/client'
import { SELECTORS, getHireMeAnchorElement } from '@components/Footer/client/selectors'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

vi.mock('@components/scripts/utils/absoluteUrl', () => ({
  absoluteUrl: (route: string) => `https://example.com${route}`,
}))

type FooterComponentModule = WebComponentModule<FooterElement>

describe('Footer selector utilities', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create({
      astroConfig: {
        site: 'https://example.com',
      },
    })
  })

  const renderFooter = async (
    assertion: (_context: { element: FooterElement }) => Promise<void> | void,
  ) => {
    await executeRender<FooterComponentModule>({
      container,
      component: Footer,
      moduleSpecifier: '@components/Footer/client/index',
      assert: async ({ element }) => {
        await assertion({ element })
      },
    })
  }

  it('returns the Hire Me anchor element from the rendered footer', async () => {
    await renderFooter(({ element }) => {
      const anchor = getHireMeAnchorElement(element)

      expect(anchor).toBeInstanceOf(HTMLAnchorElement)
      expect(anchor.matches(SELECTORS.hireMeAnchor)).toBe(true)
    })
  })

  it('throws a ClientScriptError when the Hire Me anchor is missing', async () => {
    await renderFooter(({ element }) => {
      element.querySelector(SELECTORS.hireMeAnchor)?.remove()

      expect(() => getHireMeAnchorElement(element)).toThrow(
        'Footer anchor for "Hire Me" element, selector: #page-footer__hire-me-anchor',
      )
    })
  })
})
