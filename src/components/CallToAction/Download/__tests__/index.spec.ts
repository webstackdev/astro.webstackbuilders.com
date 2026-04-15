import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

const existingResource = 'performance-testing-load-models-benchmark-accuracy'

describe('Download CallToAction (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  test('labels the section and hides decorative svgs', async () => {
    const Download = (await import('@components/CallToAction/Download/index.astro')).default

    const renderedHtml = await container.renderToString(Download, {
      props: {
        resource: 'example-resource',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const host = window.document.querySelector('download-cta')
      const section = window.document.querySelector('section')
      expect(host).toBeTruthy()
      expect(section).toBeTruthy()
      expect(section?.getAttribute('aria-labelledby')).toBe('download-cta-title')
      expect(section?.getAttribute('aria-describedby')).toBe('download-cta-description')

      expect(window.document.getElementById('download-cta-title')?.tagName).toBe('H2')
      expect(window.document.getElementById('download-cta-description')?.tagName).toBe('P')

      const svgs = window.document.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
      svgs.forEach(svg => {
        expect(svg.getAttribute('aria-hidden')).toBe('true')
        expect(svg.getAttribute('focusable')).toBe('false')
      })
    })
  })

  test('renders direct and landing download URLs for the web component host', async () => {
    const Download = (await import('@components/CallToAction/Download/index.astro')).default

    const renderedHtml = await container.renderToString(Download, {
      props: {
        resource: existingResource,
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const host = window.document.querySelector('download-cta')
      const primaryLink = window.document.querySelector('[data-download-cta-primary]')

      expect(host?.getAttribute('data-landing-url')).toBe(
        `/downloads/${existingResource}`
      )
      expect(host?.getAttribute('data-direct-download-url')).toBe(
        '/downloads/performance-testing-load-models-benchmark-accuracy.pdf'
      )
      expect(primaryLink?.getAttribute('href')).toBe(`/downloads/${existingResource}`)
    })
  })

  test('supports a custom id base for aria relationships', async () => {
    const Download = (await import('@components/CallToAction/Download/index.astro')).default

    const renderedHtml = await container.renderToString(Download, {
      props: {
        id: 'custom-download',
        resource: 'example-resource',
      },
    })

    await withJsdomEnvironment(async ({ window }) => {
      window.document.body.innerHTML = renderedHtml

      const section = window.document.querySelector('section')
      expect(section?.getAttribute('aria-labelledby')).toBe('custom-download-title')
      expect(section?.getAttribute('aria-describedby')).toBe('custom-download-description')

      expect(window.document.getElementById('custom-download-title')).toBeTruthy()
      expect(window.document.getElementById('custom-download-description')).toBeTruthy()
    })
  })

  test('throws BuildError when resource is blank', async () => {
    const Download = (await import('@components/CallToAction/Download/index.astro')).default

    await expect(
      container.renderToString(Download, {
        props: {
          resource: '   ',
        } as any,
      })
    ).rejects.toMatchObject({
      name: 'BuildError',
    })
  })
})
