import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import MastodonModal from '@components/Social/Mastodon/index.astro'
import type { MastodonModalElement as MastodonModalElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getMastodonModalElement, queryMastodonInstanceInput } from '../selectors'

type MastodonModalModule = WebComponentModule<MastodonModalElementInstance>

describe('MastodonModalElement selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the Mastodon modal layout', async () => {
    await executeRender<MastodonModalModule>({
      container,
      component: MastodonModal,
      moduleSpecifier: '@components/Social/Mastodon/client/index',
      waitForReady: async (element: MastodonModalElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        expect(
          element.modalId,
          'MastodonModalElement should default modalId to mastodon-modal'
        ).toBe('mastodon-modal')

        const modal = getMastodonModalElement(element, element.modalId)
        expect(
          modal,
          'MastodonModalElement should render a modal root with the dynamic modalId'
        ).toBeInstanceOf(HTMLDivElement)
        expect(modal.id, 'MastodonModalElement should set the modal root id to modalId').toBe(
          'mastodon-modal'
        )

        const instanceInput = queryMastodonInstanceInput(element)
        expect(
          instanceInput,
          'MastodonModalElement should render an instance input with #mastodon-instance'
        ).toBeInstanceOf(HTMLInputElement)
      },
    })
  })
})
