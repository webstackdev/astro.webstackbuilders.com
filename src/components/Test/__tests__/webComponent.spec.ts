// @vitest-environment node
import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { Window } from 'happy-dom'
import TestWebComponentAstro from '@components/Test/webComponent.astro'
import type { TestWebComponent as TestWebComponentInstance } from '@components/Test/webComponent'

type RenderResult = Awaited<ReturnType<AstroContainer['renderToString']>>

type HappyDomGlobalKey = 'window' | 'document' | 'customElements' | 'HTMLElement'
type HappyDomGlobals = Partial<Record<HappyDomGlobalKey, unknown>>

const setGlobalValue = (key: HappyDomGlobalKey, value: unknown) => {
  if (value === undefined) {
    delete (globalThis as Record<string, unknown>)[key]
    return
  }

  ;(globalThis as Record<string, unknown>)[key] = value
}

const withHappyDomEnvironment = async <TReturn>(
  callback: (_context: { window: Window }) => Promise<TReturn> | TReturn,
): Promise<TReturn> => {
  const window = new Window()
  const globalObject = globalThis as Record<string, unknown>
  const previousGlobals: HappyDomGlobals = {
    window: globalObject['window'],
    document: globalObject['document'],
    customElements: globalObject['customElements'],
    HTMLElement: globalObject['HTMLElement'],
  }

  setGlobalValue('window', window)
  setGlobalValue('document', window.document)
  setGlobalValue('customElements', window.customElements)
  setGlobalValue('HTMLElement', window.HTMLElement)

  try {
    return await callback({ window })
  } finally {
    setGlobalValue('window', previousGlobals.window)
    setGlobalValue('document', previousGlobals.document)
    setGlobalValue('customElements', previousGlobals.customElements)
    setGlobalValue('HTMLElement', previousGlobals.HTMLElement)
    await window.happyDOM?.whenAsyncComplete?.()
    await window.happyDOM?.close?.()
  }
}

describe('TestWebComponent class behavior', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const renderInHappyDom = async (
    assertion: (_context: { element: TestWebComponentInstance }) => Promise<void> | void,
  ): Promise<void> => {
    await withHappyDomEnvironment(async ({ window }) => {
      const { TestWebComponent: TestWebComponentCtor, registerTestWebComponent } = await import(
        '@components/Test/webComponent'
      )

      const renderedHtml: RenderResult = await container.renderToString(TestWebComponentAstro, {
        props: {
          heading: 'Integration test',
        },
      })

      window.document.body.innerHTML = renderedHtml
      window.document.querySelectorAll('script').forEach((script) => script.remove())

      registerTestWebComponent()

      const element = window.document.querySelector('test-web-component') as
        | TestWebComponentInstance
        | null

      if (!element) {
        throw new Error('Unable to locate rendered <test-web-component> instance in document')
      }

      expect(window.customElements.get('test-web-component')).toBe(TestWebComponentCtor)

      await element.updateComplete
      await assertion({ element })
    })
  }

  test('renders default message in light DOM', async () => {
    await renderInHappyDom(async ({ element }) => {
      expect(element.querySelector('#message')?.textContent).toBe('Hello from Lit')
    })
  })

  test('updates DOM when message changes', async () => {
    await renderInHappyDom(async ({ element }) => {
      element.message = 'Updated message'
      await element.updateComplete

      expect(element.querySelector('#message')?.textContent).toBe('Updated message')
    })
  })
})
