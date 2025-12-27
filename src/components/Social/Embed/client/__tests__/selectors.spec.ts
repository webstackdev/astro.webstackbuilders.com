import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SocialEmbed from '@components/Social/Embed/index.astro'
import type { SocialEmbedElement as SocialEmbedElementInstance } from '@components/Social/Embed/webComponent'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import {
  queryEmbedLoadingStatus,
  queryEmbedPlaceholder,
  queryUnmanagedEmbedElements,
} from '../selectors'

type SocialEmbedModule = WebComponentModule<SocialEmbedElementInstance>

describe('EmbedManager selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the Social Embed layout', async () => {
    const url = 'https://twitter.com/user/status/1234567890'

    await executeRender<SocialEmbedModule>({
      container,
      component: SocialEmbed,
      moduleSpecifier: '@components/Social/Embed/webComponent',
      args: {
        props: {
          url,
        },
      },
      waitForReady: async element => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        if (!window) {
          throw new Error('Missing JSDOM window for SocialEmbed selectors test.')
        }

        const unmanagedEmbeds = queryUnmanagedEmbedElements(window.document)

        expect(
          unmanagedEmbeds.length,
          'EmbedManager should discover at least one unmanaged [data-embed] element'
        ).toBe(1)
        expect(
          unmanagedEmbeds[0],
          'EmbedManager should discover the rendered <social-embed> element as an unmanaged embed'
        ).toBe(element)

        expect(
          element.dataset['embedUrl'],
          'social-embed should sync data-embed-url from url attribute'
        ).toBe(url)

        expect(
          queryEmbedLoadingStatus(element),
          'social-embed should render a loading status node while busy'
        ).toBeTruthy()
        expect(
          queryEmbedPlaceholder(element),
          'social-embed should render a placeholder node while busy'
        ).toBeTruthy()
      },
    })
  })
})
