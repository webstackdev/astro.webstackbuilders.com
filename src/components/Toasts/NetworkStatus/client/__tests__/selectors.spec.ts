import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import NetworkStatusToast from '@components/Toasts/NetworkStatus/index.astro'
import type { NetworkStatusToastElement as NetworkStatusToastElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getNetworkStatusToastElements } from '../selectors'

type NetworkStatusModule = WebComponentModule<NetworkStatusToastElementInstance>

describe('NetworkStatusToast selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the NetworkStatus toast layout', async () => {
    await executeRender<NetworkStatusModule>({
      container,
      component: NetworkStatusToast,
      moduleSpecifier: '@components/Toasts/NetworkStatus/client/index',
      waitForReady: async (element: NetworkStatusToastElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        const { toast, message } = getNetworkStatusToastElements(element)

        expect(toast, 'NetworkStatusToast should render a root <div> with [data-network-status-toast]').toBeInstanceOf(
          HTMLDivElement,
        )
        expect(message, 'NetworkStatusToast should render a message <span> with .toast-message').toBeInstanceOf(
          HTMLSpanElement,
        )
      },
    })
  })
})
