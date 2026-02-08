import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { JSDOM } from 'jsdom'
import Header from '@components/Header/index.astro'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import { getHeaderElement, getHeaderShellElement } from '../selectors'

describe('Header selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the Header layout', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      const renderedHtml = await container.renderToString(Header, {
        props: {
          path: '/about',
        },
      })
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

      expect(getHeaderShellElement(window.document)).toBeTruthy()
      expect(getHeaderElement(window.document)).toBeTruthy()
    })
  })
})
