import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Icon (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders a decorative icon (aria-hidden) without a title', async () => {
    const Icon = (await import('@components/Icon/index.astro')).default

    const renderedHtml = await container.renderToString(Icon, {
      props: {
        name: 'close',
        size: 24,
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const svg = window.document.querySelector('svg')
      expect(svg).toBeTruthy()
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
      expect(svg?.getAttribute('focusable')).toBe('false')

      expect(svg?.hasAttribute('title')).toBe(false)
    })
  })
})
