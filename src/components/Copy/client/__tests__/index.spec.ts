// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import CopyAstro from '@components/Copy/index.astro'
import type { CopyToClipboardElement as CopyToClipboardInstance } from '@components/Copy/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import {
  getCopyToClipboardButton,
  getCopyToClipboardContent,
  getCopyToClipboardIcon,
  getCopyToClipboardSuccessIcon,
  getCopyToClipboardWrapper,
} from '../selectors'

type CopyComponentModule = WebComponentModule<CopyToClipboardInstance>

describe('CopyToClipboardElement', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  const runComponentRender = async (
    args: Parameters<AstroContainer['renderToString']>[1],
    assertion: (_context: { element: CopyToClipboardInstance; window: Window }) => Promise<void> | void,
  ): Promise<void> => {
    await executeRender<CopyComponentModule>({
      container,
      component: CopyAstro,
      moduleSpecifier: '@components/Copy/client/index',
      args,
      waitForReady: async (element: CopyToClipboardInstance) => {
        await vi.waitFor(() => {
          const button = getCopyToClipboardButton(element)
          expect(button).toBeTruthy()
          expect(button?.dataset['copyToClipboardListener']).toBe('true')
        })
      },
      assert: async ({ element, window }) => {
        await assertion({ element, window: window as unknown as Window })
      },
    })
  }

  test('copies value attribute to clipboard and emits clipboard-copy event', async () => {
    await runComponentRender(
      {
        props: {
          value: 'hello world',
        },
        slots: {
          default: 'Copy',
        },
      },
      async ({ element, window }) => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(window.navigator, 'clipboard', {
          value: { writeText },
          configurable: true,
        })

        const copied = vi.fn()
        element.addEventListener('clipboard-copy', copied)

        const button = getCopyToClipboardButton(element)
        expect(button).toBeTruthy()

        button?.click()
        await vi.waitFor(() => {
          expect(writeText).toHaveBeenCalledWith('hello world')
        })

        await vi.waitFor(() => {
          expect(copied).toHaveBeenCalledOnce()
        })

        await vi.waitFor(() => {
          const copyIcon = getCopyToClipboardIcon(element)
          const successIcon = getCopyToClipboardSuccessIcon(element)
          expect(copyIcon?.hasAttribute('hidden')).toBe(true)
          expect(successIcon?.hasAttribute('hidden')).toBe(false)
        })
      },
    )
  })

  test('copies target element text when for= is provided', async () => {
    await runComponentRender(
      {
        props: {
          for: 'copy-target',
        },
        slots: {
          default: 'Copy',
        },
      },
      async ({ element, window }) => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(window.navigator, 'clipboard', {
          value: { writeText },
          configurable: true,
        })

        const target = window.document.createElement('div')
        target.id = 'copy-target'
        target.innerHTML = 'Hello <b>world!</b>'
        window.document.body.appendChild(target)

        expect(window.document.getElementById('copy-target')?.textContent).toBe('Hello world!')

        const button = getCopyToClipboardButton(element)
        expect(button).toBeTruthy()
        expect(button?.getAttribute('for')).toBe('copy-target')

        writeText.mockClear()

        button?.click()
        await vi.waitFor(() => {
          expect(writeText).toHaveBeenCalledWith('Hello world!')
        })
      },
    )
  })

  test('does not copy when clicking slotted content (icon-only click target)', async () => {
    await runComponentRender(
      {
        props: {
          value: 'hello world',
        },
        slots: {
          default: '<span data-test-slot-content>Copy</span>',
        },
      },
      async ({ element, window }) => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(window.navigator, 'clipboard', {
          value: { writeText },
          configurable: true,
        })

        const content = getCopyToClipboardContent(element)
        expect(content).toBeTruthy()

        const button = getCopyToClipboardButton(element)
        expect(button).toBeTruthy()

        content?.click()
        await Promise.resolve()
        expect(writeText).not.toHaveBeenCalled()

        button?.click()
        await vi.waitFor(() => {
          expect(writeText).toHaveBeenCalledWith('hello world')
        })
      },
    )
  })

  test('mode=float adds group wrapper and hides icon button until hover/focus', async () => {
    await runComponentRender(
      {
        props: {
          value: 'hello world',
          mode: 'float',
        },
        slots: {
          default: 'Copy',
        },
      },
      async ({ element }) => {
        const wrapper = getCopyToClipboardWrapper(element)
        expect(wrapper).toBeTruthy()
        expect(wrapper?.className).toContain('group')

        const button = getCopyToClipboardButton(element)
        expect(button).toBeTruthy()

        const buttonClass = button?.getAttribute('class') ?? ''
        expect(buttonClass).toContain('opacity-0')
        expect(buttonClass).toContain('pointer-events-none')
        expect(buttonClass).toContain('group-hover:opacity-100')
        expect(buttonClass).toContain('group-focus-within:opacity-100')
      },
    )
  })

  test('styles prop applies classes to wrapper, button, and icons', async () => {
    await runComponentRender(
      {
        props: {
          value: 'hello world',
          styles: {
            wrapper: 'my-wrapper',
            button: 'my-button',
            icon: 'my-icon',
            successIcon: 'my-success-icon',
          },
        },
        slots: {
          default: 'Copy',
        },
      },
      async ({ element }) => {
        const wrapper = getCopyToClipboardWrapper(element)
        expect(wrapper).toBeTruthy()
        expect(wrapper?.className).toContain('my-wrapper')

        const button = getCopyToClipboardButton(element)
        expect(button).toBeTruthy()
        expect(button?.className).toContain('my-button')

        const copySvg = getCopyToClipboardIcon(element)?.querySelector('svg')?.getAttribute('class')
        expect(copySvg ?? '').toContain('my-icon')

        const successSvg = getCopyToClipboardSuccessIcon(element)?.querySelector('svg')?.getAttribute('class')
        expect(successSvg ?? '').toContain('my-success-icon')
      },
    )
  })
})
