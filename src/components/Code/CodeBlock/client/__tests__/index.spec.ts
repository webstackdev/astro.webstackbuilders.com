import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import CodeBlockFixture from '@components/Code/CodeBlock/client/__fixtures__/codeBlock.fixture.astro'
import type { CodeBlockElement } from '../index'

type CodeBlockModule = WebComponentModule<CodeBlockElement>

describe('CodeBlock web component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const renderCodeBlock = async (
    assertion: (_context: { element: CodeBlockElement }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<CodeBlockModule>({
      container,
      component: CodeBlockFixture,
      moduleSpecifier: '@components/Code/CodeBlock/client/index',
      selector: 'code-block',
      waitForReady: async (element: CodeBlockElement) => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        await assertion({ element })
      },
    })
  }

  it('marks the element as enhanced on connect', async () => {
    await renderCodeBlock(async ({ element }) => {
      expect(element.dataset['enhanced']).toBe('true')
    })
  })
})