import { beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import SocialShares from '@components/Social/Shares/index.astro'
import type { SocialShareElement as SocialShareElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import { getSocialShareRenderElements } from '../selectors'

type SocialShareModule = WebComponentModule<SocialShareElementInstance>

describe('SocialShareElement selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the Social Shares layout', async () => {
    await executeRender<SocialShareModule>({
      container,
      component: SocialShares,
      moduleSpecifier: '@components/Social/Shares/client/index',
      args: {
        props: {
          url: 'https://example.com/article',
          title: 'Demo article',
          description: 'Example summary',
          socialNetworks: ['twitter', 'linkedin'],
        },
      },
      waitForReady: async (element: SocialShareElementInstance) => {
        await element.updateComplete
      },
      assert: async ({ element }) => {
        const { container: root, label, shareItems } = getSocialShareRenderElements(element)

        expect(root, 'SocialShareElement should render a root container with .social-share').toBeInstanceOf(HTMLDivElement)
        expect(label, 'SocialShareElement should render a label with .social-share__label').toBeInstanceOf(HTMLSpanElement)

        expect(
          shareItems.length,
          'SocialShareElement should render one [data-share] item per configured social network',
        ).toBe(2)

        const shareIds = shareItems
          .map((item) => item.getAttribute('data-share'))
          .filter((value): value is string => typeof value === 'string' && value.length > 0)

        expect(shareIds, 'SocialShareElement should render [data-share] attributes for each network').toEqual(
          expect.arrayContaining(['twitter', 'linkedin']),
        )
      },
    })
  })
})
