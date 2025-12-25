import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { JSDOM } from 'jsdom'
import Copy from '@components/Copy/index.astro'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import {
  getCopyToClipboardButton,
  getCopyToClipboardContent,
  getCopyToClipboardIcon,
  getCopyToClipboardSuccessIcon,
  getCopyToClipboardWrapper,
} from '../selectors'

describe('Copy selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the Copy layout', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      const renderedHtml = await container.renderToString(Copy)
      const sanitizedHtml = new JSDOM(`<!doctype html><html><body>${renderedHtml}</body></html>`)

      for (const script of sanitizedHtml.window.document.querySelectorAll('script')) {
        script.remove()
      }

      for (const element of sanitizedHtml.window.document.querySelectorAll('*')) {
        for (const attribute of [...element.attributes]) {
          if (attribute.name.startsWith('data-astro-cid-')) {
            element.removeAttribute(attribute.name)
          }
        }
      }

      window.document.body.innerHTML = sanitizedHtml.window.document.body.innerHTML

      const wrapper = getCopyToClipboardWrapper(window.document)
      expect(wrapper, 'Copy should render a [data-copy-to-clipboard-wrapper] element').toBeTruthy()

      expect(
        getCopyToClipboardContent(window.document),
        'Copy should render a [data-copy-to-clipboard-content] element',
      ).toBeTruthy()

      expect(
        getCopyToClipboardButton(window.document),
        'Copy should render a [data-copy-to-clipboard-button] element',
      ).toBeTruthy()

      expect(
        getCopyToClipboardIcon(window.document),
        'Copy should render a [data-copy-to-clipboard-icon] element',
      ).toBeTruthy()

      expect(
        getCopyToClipboardSuccessIcon(window.document),
        'Copy should render a [data-copy-to-clipboard-success-icon] element',
      ).toBeTruthy()

      expect(
        wrapper?.querySelector('[data-copy-to-clipboard-button]'),
        'Copy button should be inside wrapper',
      ).toBeTruthy()
    })
  })
})
