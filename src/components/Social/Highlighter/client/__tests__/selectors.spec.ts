import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Highlighter from '@components/Social/Highlighter/index.astro'
import type { HighlighterElement as HighlighterElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getHighlighterRenderElements, queryElementById } from '../selectors'

type HighlighterModule = WebComponentModule<HighlighterElementInstance>

describe('HighlighterElement selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the Highlighter layout', async () => {
    await executeRender<HighlighterModule>({
      container,
      component: Highlighter,
      moduleSpecifier: '@components/Social/Highlighter/client/index',
      args: {
        props: {
          ariaLabel: 'Share this highlight',
        },
      },
      waitForReady: async (element: HighlighterElementInstance) => {
        try {
          await element.updateComplete
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes('class fields')) {
            throw error
          }
        }
      },
      assert: async ({ element }) => {
        const { wrapper, trigger, dialog, status, shareButtons } =
          getHighlighterRenderElements(element)

        expect(
          wrapper,
          'HighlighterElement should render a wrapper with .highlighter__wrapper'
        ).toBeInstanceOf(HTMLDivElement)
        expect(
          trigger,
          'HighlighterElement should render a trigger with .highlighter__trigger'
        ).toBeInstanceOf(HTMLButtonElement)
        expect(
          dialog,
          'HighlighterElement should render a share dialog with .share-dialog'
        ).toBeInstanceOf(HTMLDivElement)
        expect(
          status,
          'HighlighterElement should render a status element with [data-highlighter-status]'
        ).toBeInstanceOf(HTMLSpanElement)

        expect(
          dialog.getAttribute('role'),
          'HighlighterElement dialog should be role="toolbar"'
        ).toBe('toolbar')
        expect(
          shareButtons.length,
          'HighlighterElement should render at least one share button'
        ).toBeGreaterThan(0)

        const describedBy = trigger.getAttribute('aria-describedby')
        expect(describedBy, 'HighlighterElement trigger should set aria-describedby').toBeTruthy()

        const hint = describedBy ? queryElementById(element, describedBy) : null
        expect(
          hint,
          'HighlighterElement should render a hint element referenced by aria-describedby'
        ).toBeTruthy()

        const controls = trigger.getAttribute('aria-controls')
        expect(controls, 'HighlighterElement trigger should set aria-controls').toBeTruthy()
        expect(dialog.id, 'HighlighterElement dialog id should match aria-controls').toBe(controls)
      },
    })
  })
})
