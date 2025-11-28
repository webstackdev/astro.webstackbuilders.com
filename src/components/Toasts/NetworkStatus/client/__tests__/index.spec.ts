// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import NetworkStatusComponent from '@components/Toasts/NetworkStatus/index.astro'
import type { NetworkStatusToastElement } from '@components/Toasts/NetworkStatus/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import type { JsdomEnvironmentContext } from '@test/unit/helpers/litRuntime'

type NetworkStatusModule = WebComponentModule<NetworkStatusToastElement>

describe('NetworkStatusToastElement', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  type TestWindow = JsdomEnvironmentContext['window']

  const renderComponent = async (
    assertion: (_context: { element: NetworkStatusToastElement; window: TestWindow }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<NetworkStatusModule>({
      container,
      component: NetworkStatusComponent,
      moduleSpecifier: '@components/Toasts/NetworkStatus/client/index',
      waitForReady: async (element) => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        if (!window) {
          return
        }
        await assertion({ element, window })
      },
    })
  }

  test('is hidden by default', async () => {
    await renderComponent(async ({ element }) => {
      const toast = element.querySelector('#network-status-toast')
      expect(toast).toBeTruthy()
      expect(toast?.classList.contains('hidden')).toBe(true)
      expect(toast?.getAttribute('data-type')).toBe('success')
    })
  })

  test('shows success toast when connection is restored', async () => {
    vi.useFakeTimers()

    await renderComponent(async ({ element, window }) => {
      window.dispatchEvent(new window.Event('online'))
      await element.updateComplete

      const toast = element.querySelector('#network-status-toast')
      expect(toast?.classList.contains('hidden')).toBe(false)
      expect(toast?.getAttribute('data-type')).toBe('success')
      expect(toast?.querySelector('.toast-message')?.textContent).toBe('Connection restored!')

      vi.advanceTimersByTime(3000)
      await element.updateComplete
      expect(toast?.classList.contains('hidden')).toBe(true)
    })
  })

  test('updates external connection indicator when present', async () => {
    await renderComponent(async ({ window }) => {
      const indicator = window.document.createElement('div')
      indicator.className = 'connection-status'
      window.document.body.appendChild(indicator)

      window.dispatchEvent(new window.Event('offline'))
      expect(indicator.textContent).toBe('Offline')
      expect(indicator.className).toContain('text-red-600')

      window.dispatchEvent(new window.Event('online'))
      expect(indicator.textContent).toBe('Online')
      expect(indicator.className).toContain('text-green-600')
    })
  })
})
