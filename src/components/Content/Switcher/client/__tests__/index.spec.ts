// @vitest-environment node

import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SwitcherAstro from '@components/Content/Switcher/index.astro'
import type { ContentSwitcherElement } from '@components/Content/Switcher/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender, type RenderResult } from '@test/unit/helpers/litRuntime'

type SwitcherModule = WebComponentModule<ContentSwitcherElement>

describe('ContentSwitcherElement', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const runComponentRender = async (
    args: Parameters<AstroContainer['renderToString']>[1],
    assertion: (_context: {
      element: ContentSwitcherElement
      renderResult: RenderResult
    }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<SwitcherModule>({
      container,
      component: SwitcherAstro,
      moduleSpecifier: '@components/Content/Switcher/client/index',
      args,
      waitForReady: async (element: ContentSwitcherElement) => {
        await element.updateComplete
      },
      assert: async ({ element, module, renderResult }) => {
        expect(renderResult).toContain(`<${module.registeredName}`)
        await assertion({ element, renderResult })
      },
    })
  }

  test('renders overview state links with deep-dive toggle target', async () => {
    await runComponentRender(
      {
        props: {
          currentVariant: 'overview',
          slug: 'my-article',
        },
      },
      async ({ element }) => {
        const overviewLink = element.querySelector('#overview-label') as HTMLAnchorElement | null
        const deepDiveLink = element.querySelector('#deep-dive-label') as HTMLAnchorElement | null
        const switchLink = element.querySelector(
          '[data-switcher-toggle]'
        ) as HTMLAnchorElement | null

        expect(overviewLink?.getAttribute('href')).toBe('/articles/my-article')
        expect(deepDiveLink?.getAttribute('href')).toBe('/deep-dive/my-article')
        expect(switchLink?.getAttribute('href')).toBe('/deep-dive/my-article')
        expect(switchLink?.getAttribute('aria-checked')).toBe('false')
      }
    )
  })

  test('renders deep-dive state with overview toggle target', async () => {
    await runComponentRender(
      {
        props: {
          currentVariant: 'deep-dive',
          slug: 'my-article',
        },
      },
      async ({ element }) => {
        const overviewLink = element.querySelector('#overview-label') as HTMLAnchorElement | null
        const deepDiveLink = element.querySelector('#deep-dive-label') as HTMLAnchorElement | null
        const switchLink = element.querySelector(
          '[data-switcher-toggle]'
        ) as HTMLAnchorElement | null

        expect(overviewLink?.getAttribute('href')).toBe('/articles/my-article')
        expect(deepDiveLink?.getAttribute('href')).toBe('/deep-dive/my-article')
        expect(switchLink?.getAttribute('href')).toBe('/articles/my-article')
        expect(switchLink?.getAttribute('aria-checked')).toBe('true')
      }
    )
  })

  test('normalizes slugs with leading and trailing slashes', async () => {
    await runComponentRender(
      {
        props: {
          currentVariant: 'overview',
          slug: '/nested/path/',
        },
      },
      async ({ element }) => {
        const overviewLink = element.querySelector('#overview-label') as HTMLAnchorElement | null
        const deepDiveLink = element.querySelector('#deep-dive-label') as HTMLAnchorElement | null

        expect(overviewLink?.getAttribute('href')).toBe('/articles/nested/path')
        expect(deepDiveLink?.getAttribute('href')).toBe('/deep-dive/nested/path')
      }
    )
  })

  test('prefetches the alternate variant href on idle', async () => {
    await runComponentRender(
      {
        props: {
          currentVariant: 'overview',
          slug: 'my-article',
        },
      },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 200))

        const prefetchLink = document.head.querySelector(
          'link[rel="prefetch"][href="/deep-dive/my-article"]'
        ) as HTMLLinkElement | null

        expect(prefetchLink).toBeTruthy()
      }
    )
  })

  test('disables the deep-dive label and toggle when the alternate variant is missing', async () => {
    await runComponentRender(
      {
        props: {
          currentVariant: 'overview',
          slug: 'article-without-deep-dive',
          hasAlternate: false,
        },
      },
      async ({ element }) => {
        const overviewLink = element.querySelector('#overview-label') as HTMLAnchorElement | null
        const deepDiveLink = element.querySelector('#deep-dive-label') as HTMLAnchorElement | null
        const switchLink = element.querySelector(
          '[data-switcher-toggle]'
        ) as HTMLAnchorElement | null

        expect(overviewLink?.getAttribute('href')).toBe('/articles/article-without-deep-dive')
        expect(overviewLink?.getAttribute('aria-disabled')).toBe('false')
        expect(deepDiveLink?.getAttribute('href')).toBeNull()
        expect(deepDiveLink?.getAttribute('aria-disabled')).toBe('true')
        expect(switchLink?.getAttribute('href')).toBeNull()
        expect(switchLink?.getAttribute('aria-disabled')).toBe('true')
      }
    )
  })

  test('disables the overview label when the alternate variant is missing on deep-dive pages', async () => {
    await runComponentRender(
      {
        props: {
          currentVariant: 'deep-dive',
          slug: 'deep-dive-without-overview',
          hasAlternate: false,
        },
      },
      async ({ element }) => {
        const overviewLink = element.querySelector('#overview-label') as HTMLAnchorElement | null
        const deepDiveLink = element.querySelector('#deep-dive-label') as HTMLAnchorElement | null
        const switchLink = element.querySelector(
          '[data-switcher-toggle]'
        ) as HTMLAnchorElement | null

        expect(deepDiveLink?.getAttribute('href')).toBe('/deep-dive/deep-dive-without-overview')
        expect(deepDiveLink?.getAttribute('aria-disabled')).toBe('false')
        expect(overviewLink?.getAttribute('href')).toBeNull()
        expect(overviewLink?.getAttribute('aria-disabled')).toBe('true')
        expect(switchLink?.getAttribute('href')).toBeNull()
        expect(switchLink?.getAttribute('aria-disabled')).toBe('true')
      }
    )
  })

  test('does not prefetch the alternate variant href when it is missing', async () => {
    await runComponentRender(
      {
        props: {
          currentVariant: 'overview',
          slug: 'article-without-deep-dive',
          hasAlternate: false,
        },
      },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 200))

        const prefetchLink = document.head.querySelector(
          'link[rel="prefetch"][href="/deep-dive/article-without-deep-dive"]'
        ) as HTMLLinkElement | null

        expect(prefetchLink).toBeNull()
      }
    )
  })

  test('renders has-alternate="false" for articles without a deep-dive entry', async () => {
    await runComponentRender(
      {
        props: {
          path: '/articles/kubernetes-pod-disruption-budget-autoscaler-node-rotation',
        },
      },
      async ({ element, renderResult }) => {
        expect(renderResult).toContain('has-alternate="false"')

        const deepDiveLink = element.querySelector('#deep-dive-label') as HTMLAnchorElement | null
        const switchLink = element.querySelector(
          '[data-switcher-toggle]'
        ) as HTMLAnchorElement | null

        expect(deepDiveLink?.getAttribute('href')).toBeNull()
        expect(switchLink?.getAttribute('href')).toBeNull()
      }
    )
  })

  test('renders the has-alternate attribute for articles with a deep-dive entry', async () => {
    await runComponentRender(
      {
        props: {
          path: '/articles/reverse-engineering-documentation-legacy-systems',
        },
      },
      async ({ element, renderResult }) => {
        expect(renderResult).toContain('has-alternate="true"')

        const deepDiveLink = element.querySelector('#deep-dive-label') as HTMLAnchorElement | null
        const switchLink = element.querySelector(
          '[data-switcher-toggle]'
        ) as HTMLAnchorElement | null

        expect(deepDiveLink?.getAttribute('href')).toBe(
          '/deep-dive/reverse-engineering-documentation-legacy-systems'
        )
        expect(switchLink?.getAttribute('href')).toBe(
          '/deep-dive/reverse-engineering-documentation-legacy-systems'
        )
      }
    )
  })
})
