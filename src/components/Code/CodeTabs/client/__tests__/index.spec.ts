import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import CodeTabsFixture from '@components/Code/CodeTabs/client/__fixtures__/codeTabs.fixture.astro'
import type { CodeTabsElement } from '../index'

type CodeTabsModule = WebComponentModule<CodeTabsElement>

describe('CodeTabs web component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderCodeTabs = async (
    props: { variant?: 'single' | 'multi' | 'excluded' },
    assertion: (_context: { element: CodeTabsElement; window: Window }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<CodeTabsModule>({
      container,
      component: CodeTabsFixture,
      moduleSpecifier: '@components/Code/CodeTabs/client/index',
      args: { props },
      selector: 'code-tabs',
      waitForReady: async (element: CodeTabsElement) => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        await assertion({ element, window: window ?? globalThis.window })
      },
    })
  }

  it('skips registration when customElements is unavailable', async () => {
    await withJsdomEnvironment(async () => {
      const globalRef = globalThis as unknown as { customElements?: CustomElementRegistry }
      const originalCustomElements = globalRef.customElements

      Object.defineProperty(globalThis, 'customElements', {
        configurable: true,
        writable: true,
        value: undefined,
      })

      try {
        const { registerCodeTabsWebComponent } =
          await import('@components/Code/CodeTabs/client/index')
        expect(() => registerCodeTabsWebComponent()).not.toThrow()
      } finally {
        Object.defineProperty(globalThis, 'customElements', {
          configurable: true,
          writable: true,
          value: originalCustomElements,
        })
      }
    })
  })

  it('copies the active code block when clipboard is available', async () => {
    await renderCodeTabs({ variant: 'single' }, async ({ element, window }) => {
      const globalRef = globalThis as unknown as { navigator?: Navigator }
      const originalNavigator = globalRef.navigator

      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        writable: true,
        value: window.navigator,
      })

      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(window.navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      })

      try {
        const copyButton = element.querySelector(
          'button[aria-label="Copy"]'
        ) as HTMLButtonElement | null
        expect(copyButton, 'CodeTabs should render a copy button').toBeTruthy()

        copyButton?.click()

        await vi.waitFor(() => {
          expect(writeText).toHaveBeenCalledWith('const x: number = 1')
        })
      } finally {
        Object.defineProperty(globalThis, 'navigator', {
          configurable: true,
          writable: true,
          value: originalNavigator,
        })
      }
    })
  })

  it('does not throw when clipboard is unavailable', async () => {
    await renderCodeTabs({ variant: 'single' }, ({ element, window }) => {
      const globalRef = globalThis as unknown as { navigator?: Navigator }
      const originalNavigator = globalRef.navigator

      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        writable: true,
        value: window.navigator,
      })

      Object.defineProperty(window.navigator, 'clipboard', {
        configurable: true,
        value: undefined,
      })

      try {
        const copyButton = element.querySelector(
          'button[aria-label="Copy"]'
        ) as HTMLButtonElement | null
        expect(copyButton, 'CodeTabs should render a copy button').toBeTruthy()

        expect(() => copyButton?.click()).not.toThrow()
      } finally {
        Object.defineProperty(globalThis, 'navigator', {
          configurable: true,
          writable: true,
          value: originalNavigator,
        })
      }
    })
  })

  it('renders a single tab label for a single named code block', async () => {
    await renderCodeTabs({ variant: 'single' }, ({ element }) => {
      const tabButton = element.querySelector('button[data-code-tabs-button="0"]')
      expect(tabButton, 'CodeTabs should render a tab button for a single named code block').toBeTruthy()
      expect(tabButton?.textContent).toBe('TypeScript')
      expect(
        tabButton?.className.includes('hover:text-content-active'),
        'Single-tab UI should not change text color on hover'
      ).toBe(false)
    })
  })

  it('does not apply hover color change to the active tab when multiple tabs exist', async () => {
    await renderCodeTabs({ variant: 'multi' }, ({ element }) => {
      const activeButton = element.querySelector('button[data-code-tabs-button="0"]')
      const inactiveButton = element.querySelector('button[data-code-tabs-button="1"]')

      expect(activeButton).toBeTruthy()
      expect(inactiveButton).toBeTruthy()

      expect(
        activeButton?.className.includes('hover:text-content-active'),
        'Active tab should not change text color on hover'
      ).toBe(false)

      expect(
        inactiveButton?.className.includes('hover:text-content-active'),
        'Inactive tab should change text color on hover'
      ).toBe(true)
    })
  })

  it('does not render tabs for excluded single-language blocks', async () => {
    await renderCodeTabs({ variant: 'excluded' }, ({ element }) => {
      const anyTabButton = element.querySelector('button[data-code-tabs-button]')
      expect(anyTabButton, 'CodeTabs should not render tab buttons for excluded languages').toBeFalsy()
    })
  })
})
