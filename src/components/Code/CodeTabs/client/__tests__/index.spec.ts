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
        const { registerCodeTabsWebComponent } = await import('@components/Code/CodeTabs/client/index')
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
        const { registerCodeTabsWebComponent } = await import('@components/Code/CodeTabs/client/index')
        registerCodeTabsWebComponent()

        const element = window.document.createElement('code-tabs')
        const pre = window.document.createElement('pre')
        const code = window.document.createElement('code')
        code.textContent = 'console.log("hello")'
        pre.appendChild(code)
        element.appendChild(pre)
        window.document.body.appendChild(element)

        const copyButton = element.querySelector('button[aria-label="Copy"]') as HTMLButtonElement | null
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

      const { registerCodeTabsWebComponent } = await import('@components/Code/CodeTabs/client/index')
      registerCodeTabsWebComponent()

      const element = window.document.createElement('code-tabs')
      const pre = window.document.createElement('pre')
      pre.textContent = 'no clipboard'
      element.appendChild(pre)
      window.document.body.appendChild(element)

      const copyButton = element.querySelector('button[aria-label="Copy"]') as HTMLButtonElement | null
      expect(copyButton, 'CodeTabs should render a copy button').toBeTruthy()

      expect(() => copyButton?.click()).not.toThrow()
    })
  })
})
