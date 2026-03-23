// @vitest-environment node

import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SwitcherAstro from '@components/Content/Switcher/index.astro'
import type { ContentSwitcherElement } from '@components/Content/Switcher/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type SwitcherModule = WebComponentModule<ContentSwitcherElement>

describe('ContentSwitcherElement', () => {
	let container: AstroContainer

	beforeEach(async () => {
		container = await AstroContainer.create()
	})

	const runComponentRender = async (
		args: Parameters<AstroContainer['renderToString']>[1],
		assertion: (_context: { element: ContentSwitcherElement }) => Promise<void> | void,
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
				await assertion({ element })
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
				const switchLink = element.querySelector('[data-switcher-toggle]') as HTMLAnchorElement | null

				expect(overviewLink?.getAttribute('href')).toBe('/articles/my-article')
				expect(deepDiveLink?.getAttribute('href')).toBe('/deep-dive/my-article')
				expect(switchLink?.getAttribute('href')).toBe('/deep-dive/my-article')
				expect(switchLink?.getAttribute('aria-checked')).toBe('false')
			},
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
				const switchLink = element.querySelector('[data-switcher-toggle]') as HTMLAnchorElement | null

				expect(overviewLink?.getAttribute('href')).toBe('/articles/my-article')
				expect(deepDiveLink?.getAttribute('href')).toBe('/deep-dive/my-article')
				expect(switchLink?.getAttribute('href')).toBe('/articles/my-article')
				expect(switchLink?.getAttribute('aria-checked')).toBe('true')
			},
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
			},
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
					'link[rel="prefetch"][href="/deep-dive/my-article"]',
				) as HTMLLinkElement | null

				expect(prefetchLink).toBeTruthy()
			},
		)
	})
})
