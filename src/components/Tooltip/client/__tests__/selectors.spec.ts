import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TooltipAstro from '@components/Tooltip/index.astro'
import type { TooltipElement as TooltipElementInstance } from '@components/Tooltip/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import {
  SELECTORS,
  getTooltipElements,
  queryTooltipFocusableDescendant,
  queryTooltipInteractiveDescendant,
} from '../selectors'

type TooltipComponentModule = WebComponentModule<TooltipElementInstance>

describe('Tooltip selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('selectors stay in sync with the tooltip layout', async () => {
    await executeRender<TooltipComponentModule>({
      container,
      component: TooltipAstro,
      moduleSpecifier: '@components/Tooltip/client/index',
      args: {
        props: {
          text: 'Tooltip body',
        },
        slots: {
          default: '<a href="/docs">Docs</a>',
        },
      },
      waitForReady: async (element: TooltipElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        const { trigger, tooltip } = getTooltipElements(element)
        const focusableDescendant = queryTooltipFocusableDescendant(trigger)
        const interactiveDescendant = queryTooltipInteractiveDescendant(trigger)

        expect(trigger.matches(SELECTORS.trigger)).toBe(true)
        expect(tooltip.matches(SELECTORS.tooltip)).toBe(true)
        expect(tooltip.getAttribute('role')).toBe('tooltip')
        expect(focusableDescendant).toBeInstanceOf(HTMLAnchorElement)
        expect(interactiveDescendant).toBeInstanceOf(HTMLAnchorElement)
      },
    })
  })
})