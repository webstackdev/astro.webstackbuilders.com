import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ConfettiAstro from '@components/Animations/Confetti/index.astro'
import type { ConfettiAnimationElement } from '@components/Animations/Confetti/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { queryConfettiCanvas } from '../selectors'

type ConfettiModule = WebComponentModule<ConfettiAnimationElement>

const renderConfetti = async (
  assert: (_context: { element: ConfettiAnimationElement }) => Promise<void> | void
): Promise<void> => {
  const container = await AstroContainer.create()

  await executeRender<ConfettiModule>({
    container,
    component: ConfettiAstro,
    moduleSpecifier: '@components/Animations/Confetti/client/index',
    args: {},
    waitForReady: async element => {
      await element.updateComplete
    },
    assert: async ({ element, module, renderResult }) => {
      expect(renderResult, 'Should render the confetti custom element').toContain(
        `<${module.registeredName}`
      )
      await assert({ element })
    },
  })
}

describe('Confetti selectors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stays in sync with the Confetti layout', async () => {
    await renderConfetti(({ element }) => {
      const canvas = queryConfettiCanvas(element)
      expect(canvas, 'Confetti should render a canvas with [data-confetti-canvas]').toBeTruthy()
      expect(canvas?.tagName, 'Confetti canvas should be a <canvas> element').toBe('CANVAS')
    })
  })
})
