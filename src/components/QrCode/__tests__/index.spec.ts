import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { JSDOM } from 'jsdom'

describe('QrCode (Astro)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const renderQrCode = async (props?: { data?: string; isHidden?: boolean }) => {
    const QrCode = (await import('@components/QrCode/index.astro')).default

    const renderOptions = {
      request: new Request('https://example.com/articles/demo'),
      ...(props ? { props } : {}),
    }

    const response = await container.renderToResponse(QrCode, renderOptions)

    return response.text()
  }

  test('renders a hidden-by-default QR code for the current request URL', async () => {
    const renderedHtml = await renderQrCode()
    const document = new JSDOM(renderedHtml).window.document

    const root = document.querySelector<HTMLElement>('figure[data-qr-code]')
    const svg = root?.querySelector('svg')
    const caption = root?.querySelector('figcaption')

    expect(root).toBeTruthy()
    expect(root?.className).toContain('hidden')
    expect(root?.getAttribute('aria-label')).toContain('https://example.com/articles/demo')
    expect(svg).toBeTruthy()
    expect(svg?.querySelector('#logo-group')).toBeTruthy()
    expect(caption?.textContent).toContain('https://example.com/articles/demo')
  })

  test('omits the hidden class when isHidden is false and respects a custom data prop', async () => {
    const renderedHtml = await renderQrCode({
      data: 'https://example.com/contact',
      isHidden: false,
    })
    const document = new JSDOM(renderedHtml).window.document

    const root = document.querySelector<HTMLElement>('figure[data-qr-code]')
    const caption = root?.querySelector('figcaption')

    expect(root).toBeTruthy()
    expect(root?.className).not.toContain('hidden')
    expect(root?.getAttribute('aria-label')).toContain('https://example.com/contact')
    expect(caption?.textContent).toContain('https://example.com/contact')
  })
})