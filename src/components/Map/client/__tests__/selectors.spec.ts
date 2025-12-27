import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { JSDOM } from 'jsdom'
import Map from '@components/Map/index.astro'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import {
  getCompanyMapAddress,
  queryCompanyMapElement,
  queryCompanyMapLoaderElement,
  queryCompanyMapMarkerElement,
  queryCompanyMapRoots,
} from '../selectors'

describe('Map selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the Map layout', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      const renderedHtml = await container.renderToString(Map)
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

      const roots = queryCompanyMapRoots(window.document)
      expect(roots.length, 'Map should render exactly one [data-company-map] root element').toBe(1)

      const root = roots[0]
      if (!root) {
        throw new Error('Missing Map root element after rendering Map/index.astro')
      }
      expect(
        getCompanyMapAddress(root),
        'Map should provide a non-empty data-address attribute'
      ).not.toBe('')

      expect(
        queryCompanyMapLoaderElement(root),
        'Map should render a <gmpx-api-loader> element'
      ).toBeTruthy()
      expect(queryCompanyMapElement(root), 'Map should render a <gmp-map> element').toBeTruthy()
      expect(
        queryCompanyMapMarkerElement(root),
        'Map should render a <gmp-advanced-marker> element'
      ).toBeTruthy()
    })
  })
})
