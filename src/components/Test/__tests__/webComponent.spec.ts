// @vitest-environment node
import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TestWebComponentAstro from '@components/Test/webComponent.astro'
import type { TestWebComponent as TestWebComponentInstance } from '@components/Test/webComponent'
import {
  renderInHappyDom,
  type RenderResult,
} from '@test/unit/helpers/litRuntime'

type TestComponentModule = typeof import('@components/Test/webComponent')

describe('TestWebComponent class behavior', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const componentSelector = 'test-web-component'
  const renderArgs = {
    props: {
      heading: 'Integration test',
    },
  }

  const executeRender = async (
    assertion: (_context: { element: TestWebComponentInstance }) => Promise<void> | void,
  ): Promise<void> => {
    await renderInHappyDom<TestWebComponentInstance, TestComponentModule>({
      container,
      component: TestWebComponentAstro,
      args: renderArgs,
      selector: componentSelector,
      hydrate: async () => {
        const module = await import('@components/Test/webComponent')
        module.registerTestWebComponent()
        return module
      },
      waitForReady: async (element) => {
        await element.updateComplete
      },
      assert: async ({ element, window, hydrateResult, renderResult }) => {
        expect(window.customElements.get(componentSelector)).toBe(
          hydrateResult.TestWebComponent,
        )
        const hydratedMarkup: RenderResult = renderResult
        expect(hydratedMarkup).toContain(`<${componentSelector}`)

        await assertion({ element })
      },
    })
  }

  test('renders default message in light DOM', async () => {
    await executeRender(async ({ element }) => {
      expect(element.querySelector('#message')?.textContent).toBe('Hello from Lit')
    })
  })

  test('updates DOM when message changes', async () => {
    await executeRender(async ({ element }) => {
      element.message = 'Updated message'
      await element.updateComplete

      expect(element.querySelector('#message')?.textContent).toBe('Updated message')
    })
  })
})
