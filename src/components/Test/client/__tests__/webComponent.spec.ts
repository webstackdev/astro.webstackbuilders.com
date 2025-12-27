import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TestWebComponentAstro from '@components/Test/webComponent.astro'
import type { TestWebComponent as TestWebComponentInstance } from '../webComponent'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

type TestComponentModule = WebComponentModule<TestWebComponentInstance>

describe('TestWebComponent class behavior', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const renderArgs = {
    props: {
      heading: 'Integration test',
    },
  }

  const runComponentRender = async (
    assertion: (_context: { element: TestWebComponentInstance }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<TestComponentModule>({
      container,
      component: TestWebComponentAstro,
      moduleSpecifier: '@components/Test/client/webComponent',
      args: renderArgs,
      waitForReady: async (element: TestWebComponentInstance) => {
        await element.updateComplete
      },
      assert: async ({
        element,
        module,
        renderResult,
      }: {
        element: TestWebComponentInstance
        module: TestComponentModule
        renderResult: string
      }) => {
        expect(renderResult).toContain(`<${module.registeredName}`)
        await assertion({ element })
      },
    })
  }

  test('renders default message in light DOM', async () => {
    await runComponentRender(async ({ element }) => {
      expect(element.querySelector('#message')?.textContent).toBe('Hello from Lit')
    })
  })

  test('updates DOM when message changes', async () => {
    await runComponentRender(async ({ element }) => {
      element.message = 'Updated message'
      await element.updateComplete

      expect(element.querySelector('#message')?.textContent).toBe('Updated message')
    })
  })
})
