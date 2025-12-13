import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Callout (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders a note callout with a screen-reader-only type label', async () => {
    const Callout = (await import('@components/Callout/index.astro')).default

    const renderedHtml = await container.renderToString(Callout, {
      props: {
        type: 'warning',
      },
      slots: {
        default: 'Be careful.',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const callout = window.document.querySelector('.callout')
      expect(callout).toBeTruthy()
      expect(callout?.getAttribute('role')).toBe('note')

      const srLabel = window.document.querySelector('.callout__content .sr-only')
      expect(srLabel).toBeTruthy()
      expect(srLabel?.textContent).toContain('Warning callout:')

      const svg = window.document.querySelector('.callout__icon svg')
      expect(svg).toBeTruthy()
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
      expect(svg?.getAttribute('focusable')).toBe('false')
    })
  })
})
