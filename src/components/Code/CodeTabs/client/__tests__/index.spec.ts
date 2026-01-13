import { describe, expect, it, vi } from 'vitest'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('CodeTabs web component', () => {
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
    await withJsdomEnvironment(async ({ window }) => {
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
        const { registerCodeTabsWebComponent } =
          await import('@components/Code/CodeTabs/client/index')
        registerCodeTabsWebComponent()

        const element = window.document.createElement('code-tabs')
        const pre = window.document.createElement('pre')
        const code = window.document.createElement('code')
        code.textContent = 'console.log("hello")'
        pre.appendChild(code)
        element.appendChild(pre)
        window.document.body.appendChild(element)

        const copyButton = element.querySelector(
          'button[aria-label="Copy"]'
        ) as HTMLButtonElement | null
        expect(copyButton, 'CodeTabs should render a copy button').toBeTruthy()

        copyButton?.click()

        await vi.waitFor(() => {
          expect(writeText).toHaveBeenCalledWith('console.log("hello")')
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
    await withJsdomEnvironment(async ({ window }) => {
      Object.defineProperty(window.navigator, 'clipboard', {
        configurable: true,
        value: undefined,
      })

      const { registerCodeTabsWebComponent } =
        await import('@components/Code/CodeTabs/client/index')
      registerCodeTabsWebComponent()

      const element = window.document.createElement('code-tabs')
      const pre = window.document.createElement('pre')
      pre.textContent = 'no clipboard'
      element.appendChild(pre)
      window.document.body.appendChild(element)

      const copyButton = element.querySelector(
        'button[aria-label="Copy"]'
      ) as HTMLButtonElement | null
      expect(copyButton, 'CodeTabs should render a copy button').toBeTruthy()

      expect(() => copyButton?.click()).not.toThrow()
    })
  })

  it('renders a single tab label for a single named code block', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      const { registerCodeTabsWebComponent } =
        await import('@components/Code/CodeTabs/client/index')
      registerCodeTabsWebComponent()

      const element = window.document.createElement('code-tabs')
      const pre = window.document.createElement('pre')
      pre.setAttribute('data-language', 'typescript')

      const code = window.document.createElement('code')
      code.textContent = 'const x: number = 1'
      pre.appendChild(code)

      element.appendChild(pre)
      window.document.body.appendChild(element)

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
    await withJsdomEnvironment(async ({ window }) => {
      const { registerCodeTabsWebComponent } =
        await import('@components/Code/CodeTabs/client/index')
      registerCodeTabsWebComponent()

      const element = window.document.createElement('code-tabs')

      const preA = window.document.createElement('pre')
      preA.setAttribute('data-code-tabs-tab', 'A')
      preA.setAttribute('data-language', 'javascript')
      preA.appendChild(window.document.createElement('code'))

      const preB = window.document.createElement('pre')
      preB.setAttribute('data-code-tabs-tab', 'B')
      preB.setAttribute('data-language', 'typescript')
      preB.appendChild(window.document.createElement('code'))

      element.appendChild(preA)
      element.appendChild(preB)
      window.document.body.appendChild(element)

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
    await withJsdomEnvironment(async ({ window }) => {
      const { registerCodeTabsWebComponent } =
        await import('@components/Code/CodeTabs/client/index')
      registerCodeTabsWebComponent()

      const element = window.document.createElement('code-tabs')
      const pre = window.document.createElement('pre')
      pre.setAttribute('data-language', 'text')
      pre.textContent = 'plain text'
      element.appendChild(pre)
      window.document.body.appendChild(element)

      const anyTabButton = element.querySelector('button[data-code-tabs-button]')
      expect(anyTabButton, 'CodeTabs should not render tab buttons for excluded languages').toBeFalsy()
    })
  })
})
