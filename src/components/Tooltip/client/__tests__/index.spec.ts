import { beforeEach, describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TooltipAstro from '@components/Tooltip/index.astro'
import {
  enhanceTooltipElements,
  type TooltipElement as TooltipElementInstance,
} from '@components/Tooltip/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getTooltipElements } from '../selectors'

type TooltipComponentModule = WebComponentModule<TooltipElementInstance>

describe('TooltipElement', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const runComponentRender = async (
    args: Parameters<AstroContainer['renderToString']>[1],
    assertion: (_context: {
      element: TooltipElementInstance
      window: Window
    }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<TooltipComponentModule>({
      container,
      component: TooltipAstro,
      moduleSpecifier: '@components/Tooltip/client/index',
      args,
      waitForReady: async (element: TooltipElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        await assertion({ element, window: window as unknown as Window })
      },
    })
  }

  test('wires aria-describedby and keeps the tooltip hidden by default', async () => {
    await runComponentRender(
      {
        props: {
          text: 'HyperText Markup Language',
        },
        slots: {
          default: '<abbr>HTML</abbr>',
        },
      },
      async ({ element }) => {
        const { trigger, tooltip } = getTooltipElements(element)

        expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id)
        expect(trigger.tabIndex).toBe(0)
        expect(tooltip.classList.contains('hidden')).toBe(true)
        expect(tooltip.getAttribute('aria-hidden')).toBe('true')
      }
    )
  })

  test('shows on hover and hides on mouse leave', async () => {
    await runComponentRender(
      {
        props: {
          text: 'HyperText Markup Language',
        },
        slots: {
          default: '<abbr>HTML</abbr>',
        },
      },
      async ({ element }) => {
        const { trigger, tooltip } = getTooltipElements(element)

        trigger.dispatchEvent(new Event('mouseenter'))
        await element.updateComplete

        expect(tooltip.classList.contains('hidden')).toBe(false)
        expect(tooltip.getAttribute('aria-hidden')).toBe('false')

        trigger.dispatchEvent(new Event('mouseleave'))
        await element.updateComplete

        expect(tooltip.classList.contains('hidden')).toBe(true)
        expect(tooltip.getAttribute('aria-hidden')).toBe('true')
      }
    )
  })

  test('closes when escape is pressed after opening on focus', async () => {
    await runComponentRender(
      {
        props: {
          text: 'Tooltip body',
        },
        slots: {
          default: 'Info',
        },
      },
      async ({ element }) => {
        const { trigger, tooltip } = getTooltipElements(element)

        trigger.dispatchEvent(new Event('focusin', { bubbles: true }))
        await element.updateComplete
        expect(tooltip.classList.contains('hidden')).toBe(false)

        const escapeEvent = new Event('keyup', { bubbles: true })
        Object.defineProperty(escapeEvent, 'key', { value: 'Escape' })
        trigger.dispatchEvent(escapeEvent)
        await element.updateComplete
        expect(tooltip.classList.contains('hidden')).toBe(true)
      }
    )
  })

  test('does not add a wrapper tabindex when the slotted content is already focusable', async () => {
    await runComponentRender(
      {
        props: {
          text: 'Open documentation',
        },
        slots: {
          default: '<a href="/docs">Docs</a>',
        },
      },
      async ({ element }) => {
        const { trigger } = getTooltipElements(element)

        expect(trigger.hasAttribute('tabindex')).toBe(false)
      }
    )
  })

  test('upgrades markdown-style tooltip candidates without throwing during connection', async () => {
    await runComponentRender(
      {
        props: {
          text: 'Tooltip body',
        },
        slots: {
          default: 'Info',
        },
      },
      async ({ window }) => {
        const host = window.document.createElement('div')
        host.innerHTML = '<abbr data-tooltip="" title="Pod Security Policy">PSP</abbr>'
        window.document.body.append(host)

        expect(() => enhanceTooltipElements(host)).not.toThrow()

        const upgradedTooltip = host.querySelector('site-tooltip')
        const trigger = upgradedTooltip?.querySelector('[data-tooltip-trigger]')
        const tooltip = upgradedTooltip?.querySelector('[data-tooltip-popup]')

        expect(upgradedTooltip).toBeTruthy()
        expect(trigger?.textContent).toBe('PSP')
        expect(tooltip?.textContent).toBe('Pod Security Policy')
      }
    )
  })
})