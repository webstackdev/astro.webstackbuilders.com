import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Inset (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('renders a figure caption below the inset body when provided', async () => {
    const Inset = (await import('@components/Inset/index.astro')).default

    const renderedHtml = await container.renderToString(Inset, {
      props: {
        color: 'warning-inverse',
        figure: 'Retry budget pseudocode',
        variant: 'default',
      },
      slots: {
        default: 'if (!budget.canRetry()) return false;',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const figure = window.document.querySelector('figure')
      expect(figure).toBeTruthy()
      expect(figure?.className).toContain('mb-8')

      const figcaption = figure?.querySelector('figcaption')
      expect(figcaption).toBeTruthy()
      expect(figcaption?.textContent).toContain('Retry budget pseudocode')
      expect(figcaption?.className).toContain('italic')
      expect(figcaption?.className).toContain('text-center')

      const insetBody = figure?.querySelector('div')
      expect(insetBody).toBeTruthy()
      expect(insetBody?.className).toContain('w-full')
      expect(insetBody?.textContent).toContain('if (!budget.canRetry()) return false;')
    })
  })

  test('renders a fit-width inset when fullWidth is false', async () => {
    const Inset = (await import('@components/Inset/index.astro')).default

    const renderedHtml = await container.renderToString(Inset, {
      props: {
        fullWidth: false,
        variant: 'default',
      },
      slots: {
        default: 'const fallback = queueForRetry(request)',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const figure = window.document.querySelector('figure')
      expect(figure).toBeTruthy()
      const insetBody = figure?.querySelector('div')
      expect(insetBody).toBeTruthy()
      expect(insetBody?.className).toContain('w-fit')
      expect(insetBody?.className).toContain('max-w-full')
      expect(insetBody?.className).toContain('mx-auto')
    })
  })

  test('omits the figcaption when no figure text is provided', async () => {
    const Inset = (await import('@components/Inset/index.astro')).default

    const renderedHtml = await container.renderToString(Inset, {
      props: {
        variant: 'default',
      },
      slots: {
        default: 'const circuit = new CircuitBreaker(service, config)',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      expect(window.document.querySelector('figcaption')).toBeNull()
      expect(window.document.querySelector('figure div')?.textContent).toContain(
        'const circuit = new CircuitBreaker(service, config)'
      )
    })
  })
})
