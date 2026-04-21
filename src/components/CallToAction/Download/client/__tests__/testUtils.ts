import { expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import DownloadCtaFixture from './__fixtures__/downloadCta.fixture.astro'
import type { DownloadCtaElement } from '@components/CallToAction/Download/client'
import { TestError } from '@test/errors'
import {
  getDownloadCtaHost,
  getDownloadCtaPrimaryLink,
  getDownloadCtaUrls,
} from '@components/CallToAction/Download/client/selectors'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

export type DownloadCtaModule = WebComponentModule<DownloadCtaElement>

export interface DownloadCtaElements {
  host: HTMLElement
  primaryLink: HTMLAnchorElement
}

export interface RenderDownloadCtaContext {
  element: DownloadCtaElement
  module: DownloadCtaModule
  window: Window & typeof globalThis
  elements: DownloadCtaElements
  urls: {
    landingUrl: string
    directDownloadUrl: string
  }
}

export type RenderDownloadCtaAssertion = (
  _context: RenderDownloadCtaContext
) => Promise<void> | void

export const renderDownloadCta = async (assertion: RenderDownloadCtaAssertion): Promise<void> => {
  const container = await AstroContainer.create()

  await executeRender<DownloadCtaModule>({
    container,
    component: DownloadCtaFixture,
    moduleSpecifier: '@components/CallToAction/Download/client/index',
    selector: 'download-cta',
    waitForReady: async element => {
      element.initialize()
      await Promise.resolve()
    },
    assert: async ({ element, module, window, renderResult }) => {
      if (!window) {
        throw new TestError('Download CTA tests require a DOM-like window environment')
      }

      const domWindow = window as Window & typeof globalThis
      const host = getDownloadCtaHost(domWindow.document)
      const primaryLink = getDownloadCtaPrimaryLink(domWindow.document)

      expect(renderResult).toContain(`<${module.registeredName}`)

      await assertion({
        element,
        module,
        window: domWindow,
        elements: {
          host,
          primaryLink,
        },
        urls: getDownloadCtaUrls(domWindow.document),
      })
    },
  })
}
